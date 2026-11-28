export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isCronAuthorized } from "@/src/lib/auth/cron-auth";
import {
  processAudioCleanup,
  processImageCleanup,
} from "@/src/services/audio-cleanup-cron.service";
import { deleteExpiredShortLinks } from "@/src/repo/shortlinks.repo";
import { processPlanExpiration } from "@/src/services/plan-expiration-service";
import {
  MEDIA_CLEANUP_ENABLED,
  SHORTLINK_CLEANUP_TTL_DAYS,
} from "@/src/lib/constants";

type MediaCleanupResponse = {
  audioCleanup: Awaited<ReturnType<typeof processAudioCleanup>> | "paused";
  imageCleanup: Awaited<ReturnType<typeof processImageCleanup>> | "paused";
};

async function runMediaCleanup(): Promise<MediaCleanupResponse> {
  if (!MEDIA_CLEANUP_ENABLED) {
    return { audioCleanup: "paused", imageCleanup: "paused" };
  }
  const [audioCleanup, imageCleanup] = await Promise.all([
    processAudioCleanup(),
    processImageCleanup(),
  ]);
  return { audioCleanup, imageCleanup };
}

export async function GET(): Promise<NextResponse> {
  const authHeader = (await headers()).get("authorization");
  if (!isCronAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shortLinkThreshold = new Date(
      Date.now() - SHORTLINK_CLEANUP_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    const [mediaCleanup, shortLinkDeleted, planExpiration] = await Promise.all([
      runMediaCleanup(),
      deleteExpiredShortLinks(shortLinkThreshold),
      processPlanExpiration(),
    ]);
    return NextResponse.json({
      ...mediaCleanup,
      shortLinkCleanup: { deleted: shortLinkDeleted },
      planExpiration,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[get/api/cron/audio-cleanup] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
