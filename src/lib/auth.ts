import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

/**
 * Very small shared-password gate for the internal pages.
 *
 * There are no user accounts. One password (env `APP_PASSWORD`) unlocks every
 * internal page. On success we set an httpOnly cookie containing an HMAC token
 * derived from `AUTH_SECRET` — so the cookie can't be forged without the secret,
 * and it never contains the password itself.
 */

const COOKIE_NAME = "sst_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const TOKEN_MESSAGE = "self-storage-tracker::authenticated";

function expectedToken(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return crypto.createHmac("sha256", secret).update(TOKEN_MESSAGE).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Check the submitted password against `APP_PASSWORD`. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

/** Set the session cookie. Call only after `verifyPassword` succeeds. */
export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Clear the session cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** True if the current request carries a valid session cookie. */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies();
    const value = store.get(COOKIE_NAME)?.value;
    if (!value) return false;
    return safeEqual(value, expectedToken());
  } catch {
    return false;
  }
}

/**
 * Guard for internal pages and Server Actions. Redirects to /login when the
 * session is missing or invalid. Next.js middleware/proxy alone is not enough —
 * every Server Action must call this too.
 */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}
