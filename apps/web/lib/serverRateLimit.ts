type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as typeof globalThis & {
  __integrateRateBuckets?: Map<string, Bucket>;
};

const buckets = globalBuckets.__integrateRateBuckets ?? new Map<string, Bucket>();
globalBuckets.__integrateRateBuckets = buckets;

export function clientAddress(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "local";
}

export function checkRateLimit(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }
  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfterSeconds: 0 };
}

export function requestTooLarge(headers: Headers, maxBytes: number) {
  const length = Number(headers.get("content-length") || 0);
  return Number.isFinite(length) && length > maxBytes;
}
