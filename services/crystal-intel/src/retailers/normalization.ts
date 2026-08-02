export const stripMarkup = (value: string): string =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const matchFirst = (
  payload: string,
  patterns: RegExp[],
): string | null => {
  for (const pattern of patterns) {
    const result = pattern.exec(payload);

    if (result?.[1]) {
      return stripMarkup(result[1]);
    }
  }

  return null;
};

export const parsePriceCents = (
  value: string | null,
): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
};

export const booleanToInteger = (
  value: boolean | null,
): number | null => (value === null ? null : value ? 1 : 0);

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
