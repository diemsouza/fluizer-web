"use client";

import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { SOCIAL_PROFILES } from "@/src/lib/constants";

export function FooterSocial() {
  return (
    <div className="flex items-center justify-center gap-6 py-4 opacity-80 hover:opacity-100 transition">
      <a
        href={SOCIAL_PROFILES.instagram}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        className="touch-target hover:opacity-70 transition"
      >
        <Instagram className="h-5 w-5" />
      </a>

      <a
        href={SOCIAL_PROFILES.linkedin}
        target="_blank"
        rel="noreferrer"
        aria-label="LinkedIn"
        className="touch-target hover:opacity-70 transition"
      >
        <Linkedin className="h-5 w-5" />
      </a>

      {/* <a
        href="https://twitter.com/usefluizer"
        target="_blank"
        rel="noreferrer"
        aria-label="X / Twitter"
        className="touch-target hover:opacity-70 transition"
      >
        <Twitter className="h-5 w-5" />
      </a> */}

      <a
        href={SOCIAL_PROFILES.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        className="touch-target hover:opacity-70 transition"
      >
        <Facebook className="h-5 w-5" />
      </a>
    </div>
  );
}
