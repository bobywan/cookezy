import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "cookezy_admin";
const MIN_ADMIN_PASSWORD_LENGTH = 12;
const SESSION_30_DAYS = 60 * 60 * 24 * 30;
export const SESSION_7_DAYS = 60 * 60 * 24 * 7;

export function adminPasswordMessage(): string | null {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return "Le mot de passe administrateur n'est pas configuré.";
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return "Le mot de passe administrateur doit contenir au moins 12 caractères.";
  }
  return null;
}

function configuredPassword(): string | null {
  if (adminPasswordMessage()) return null;
  return process.env.ADMIN_PASSWORD ?? null;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sessionToken(password: string): string {
  return createHmac("sha256", password).update("cookezy-admin").digest("base64url");
}

export async function isAdmin(): Promise<boolean> {
  const password = configuredPassword();
  if (!password) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  return safeEqual(value, sessionToken(password));
}

export async function startAdminSession(
  password: string,
  maxAge = SESSION_30_DAYS,
): Promise<boolean> {
  if (maxAge !== SESSION_30_DAYS && maxAge !== SESSION_7_DAYS) return false;
  const expected = configuredPassword();
  if (!expected || password.length > 200 || !safeEqual(password, expected)) return false;
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return true;
}
