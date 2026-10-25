import { getSql, hasDatabase } from "@/lib/db";

type CountRow = { count: number | string };

const memory = new Map<string, { count: number; resetAt: number }>();
let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = getSql()`
      CREATE TABLE IF NOT EXISTS rate_limits (
        bucket text PRIMARY KEY,
        count integer NOT NULL,
        reset_at timestamptz NOT NULL
      )
    `
      .then(() => undefined)
      .catch((error: unknown) => {
        tableReady = null;
        throw error;
      });
  }
  return tableReady;
}

function bumpMemory(bucket: string, windowMs: number): number {
  const now = Date.now();
  const entry = memory.get(bucket);
  if (!entry || now > entry.resetAt) {
    memory.set(bucket, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export async function noteRateLimit(bucket: string, windowMs: number): Promise<number> {
  if (!hasDatabase()) return bumpMemory(bucket, windowMs);
  await ensureTable();
  const resetAt = new Date(Date.now() + windowMs).toISOString();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO rate_limits (bucket, count, reset_at)
    VALUES (${bucket}, 1, ${resetAt})
    ON CONFLICT (bucket) DO UPDATE SET
      count = CASE
        WHEN rate_limits.reset_at <= now() THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= now() THEN ${resetAt}::timestamptz
        ELSE rate_limits.reset_at
      END
    RETURNING count
  `) as CountRow[];
  return Number(rows[0]?.count ?? 1);
}

export async function rateLimitCount(bucket: string): Promise<number> {
  if (!hasDatabase()) {
    const entry = memory.get(bucket);
    if (!entry || Date.now() > entry.resetAt) return 0;
    return entry.count;
  }
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT count FROM rate_limits WHERE bucket = ${bucket} AND reset_at > now()
  `) as CountRow[];
  return Number(rows[0]?.count ?? 0);
}

export async function clearRateLimit(bucket: string): Promise<void> {
  if (!hasDatabase()) {
    memory.delete(bucket);
    return;
  }
  await ensureTable();
  const sql = getSql();
  await sql`DELETE FROM rate_limits WHERE bucket = ${bucket}`;
}

export async function allowRateLimit(
  bucket: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const count = await noteRateLimit(bucket, windowMs);
  return count <= max;
}
