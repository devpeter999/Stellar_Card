export interface ExponentialBackoffDelayOptions {
  /** Zero-based retry attempt index. */
  attempt: number;
  /** Initial exponential delay in milliseconds. */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds. */
  maxDelayMs: number;
  /** Exponential multiplier. Defaults to 2. */
  factor?: number;
  /** Optional Retry-After header value from the server. */
  retryAfter?: string | null;
  /** Jitter mode. Full jitter is the default. */
  jitter?: 'full' | 'none';
  /** Override the current clock for tests. */
  nowMs?: number;
}

/**
 * Parse an HTTP Retry-After header into milliseconds.
 *
 * Supports both delta-seconds (`120`) and HTTP-date values. Returns
 * `null` for empty or malformed headers so callers can fall back to
 * client-side retry policy.
 */
export function parseRetryAfterMs(
  retryAfter: string | null | undefined,
  nowMs = Date.now(),
): number | null {
  if (!retryAfter) return null;
  const value = retryAfter.trim();
  if (!value) return null;

  if (/^\d+(\.\d+)?$/.test(value)) {
    const ms = Math.ceil(Number(value) * 1000);
    return Number.isFinite(ms) ? Math.max(0, ms) : null;
  }

  const timestampMs = Date.parse(value);
  if (Number.isNaN(timestampMs)) return null;
  return Math.max(0, timestampMs - nowMs);
}

/**
 * Compute a capped exponential backoff delay for an API retry attempt.
 *
 * Full jitter spreads clients across the entire retry window to avoid
 * synchronized retries. When the server provides `Retry-After`, that
 * value is treated as a minimum delay and can extend the client-side
 * backoff.
 */
export function calculateExponentialBackoffDelay(
  opts: ExponentialBackoffDelayOptions,
): number {
  const factor = opts.factor ?? 2;
  const jitter = opts.jitter ?? 'full';
  const cappedDelay = Math.min(opts.baseDelayMs * Math.pow(factor, opts.attempt), opts.maxDelayMs);
  const jitteredDelay =
    jitter === 'none' ? cappedDelay : Math.floor(Math.random() * Math.max(cappedDelay, 1));
  const retryAfterMs = parseRetryAfterMs(opts.retryAfter, opts.nowMs);
  return retryAfterMs === null ? jitteredDelay : Math.max(jitteredDelay, retryAfterMs);
}

/** Sleep for the requested number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
