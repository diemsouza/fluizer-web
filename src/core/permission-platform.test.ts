import { describe, expect, it } from "vitest";
import { resolvePermissionPlatform } from "./permission-platform";

const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const SAFARI_IPAD =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const SAFARI_MAC = SAFARI_IPAD;
const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("resolvePermissionPlatform", () => {
  it("detecta iPhone no navegador e com app salvo", () => {
    const base = { userAgent: SAFARI_IOS, maxTouchPoints: 5 };
    expect(resolvePermissionPlatform({ ...base, isStandalone: false })).toBe(
      "ios_browser",
    );
    expect(resolvePermissionPlatform({ ...base, isStandalone: true })).toBe(
      "ios_standalone",
    );
  });

  it("trata iPad que se apresenta como Mac", () => {
    expect(
      resolvePermissionPlatform({
        userAgent: SAFARI_IPAD,
        maxTouchPoints: 5,
        isStandalone: false,
      }),
    ).toBe("ios_browser");
  });

  it("detecta Android no navegador e instalado", () => {
    const base = { userAgent: CHROME_ANDROID, maxTouchPoints: 5 };
    expect(resolvePermissionPlatform({ ...base, isStandalone: false })).toBe(
      "android_browser",
    );
    expect(resolvePermissionPlatform({ ...base, isStandalone: true })).toBe(
      "android_standalone",
    );
  });

  it("separa Safari do Mac e desktop", () => {
    expect(
      resolvePermissionPlatform({
        userAgent: SAFARI_MAC,
        maxTouchPoints: 0,
        isStandalone: false,
      }),
    ).toBe("mac_safari");
    expect(
      resolvePermissionPlatform({
        userAgent: CHROME_DESKTOP,
        maxTouchPoints: 0,
        isStandalone: true,
      }),
    ).toBe("desktop");
  });
});
