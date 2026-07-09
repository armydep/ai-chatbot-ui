/**
 * Generate a RFC-4122 v4 UUID.
 *
 * Uses crypto.randomUUID() when available, but that API only exists in a
 * SECURE CONTEXT (HTTPS or localhost). When the app is served over plain
 * HTTP on a real hostname (e.g. http://armydep.duckdns.org), randomUUID is
 * undefined and calling it throws. crypto.getRandomValues() has no such
 * restriction, so we fall back to it to build a v4 UUID by hand.
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}
