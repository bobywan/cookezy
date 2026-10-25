import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "cookezy_admin";

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
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  return safeEqual(value, sessionToken(password));
}

export async function startAdminSession(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !safeEqual(password, expected)) return false;
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}
