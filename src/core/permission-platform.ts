export type PermissionPlatform =
  | "ios_browser"
  | "ios_standalone"
  | "android_browser"
  | "android_standalone"
  | "mac_safari"
  | "desktop";

export type PermissionPlatformInput = {
  userAgent: string;
  maxTouchPoints: number;
  isStandalone: boolean;
};

export function resolvePermissionPlatform({
  userAgent,
  maxTouchPoints,
  isStandalone,
}: PermissionPlatformInput): PermissionPlatform {
  // iPadOS se apresenta como Mac; o toque diferencia.
  const isIos =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (isIos) return isStandalone ? "ios_standalone" : "ios_browser";
  if (/Android/.test(userAgent)) {
    return isStandalone ? "android_standalone" : "android_browser";
  }
  const isSafari =
    /Safari/.test(userAgent) && !/Chrome|Chromium|Edg|Firefox/.test(userAgent);
  return isSafari ? "mac_safari" : "desktop";
}
