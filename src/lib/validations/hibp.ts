import { createHash } from "crypto";

const HIBP_RANGE_API = "https://api.pwnedpasswords.com/range";

export async function isPasswordPwned(password: string): Promise<number> {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`${HIBP_RANGE_API}/${prefix}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`[HIBP] Password range lookup failed with status ${response.status}`);
      return 0;
    }

    const body = await response.text();
    const lines = body.split("\n");

    for (const rawLine of lines) {
      const [hashSuffix, countRaw] = rawLine.trim().split(":");
      if (!hashSuffix || !countRaw) continue;
      if (hashSuffix.toUpperCase() !== suffix) continue;

      const count = Number.parseInt(countRaw.trim(), 10);
      return Number.isNaN(count) ? 0 : count;
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[HIBP] Password range lookup unavailable: ${message}`);
    return 0;
  }
}
