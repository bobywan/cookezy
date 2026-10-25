type HeaderList = { get(name: string): string | null };

export function clientIpFrom(headerList: HeaderList): string {
  const real = headerList.get("x-real-ip")?.split(",")[0]?.trim();
  if (real) return real;
  const vercel = headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  return "unknown";
}
