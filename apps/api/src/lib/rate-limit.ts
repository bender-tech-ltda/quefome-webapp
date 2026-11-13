/** Fixed-window in-memory rate limiter (per instance). Enough for the MVP; swap for Redis when scaling out. */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Returns true when the call is allowed. */
  hit(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= t) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      if (this.hits.size > 10_000) for (const [k, v] of this.hits) if (v.resetAt <= t) this.hits.delete(k);
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  reset() {
    this.hits.clear();
  }
}
