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

/**
 * Sleep for the requested number of milliseconds.
 *
 * @param ms - Duration to wait in milliseconds. Values ≤ 0 resolve immediately.
 * @returns A promise that resolves after the specified delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Options for {@link withRetry}.
 *
 * @template T - The resolved value type of the operation being retried.
 */
export interface WithRetryOptions<T> {
  /**
   * The async operation to attempt. Receives the zero-based attempt index
   * (0 on the first call, 1 on the first retry, …).
   */
  fn: (attempt: number) => Promise<T>;
  /**
   * Maximum number of additional attempts after the first failure.
   * Set to 0 to disable retries (only one attempt total). Defaults to 2.
   */
  maxRetries?: number;
  /**
   * Initial delay before the first retry, in milliseconds. Doubles on
   * each subsequent attempt. Defaults to 500.
   */
  baseDelayMs?: number;
  /**
   * Upper cap on the computed delay, in milliseconds. Defaults to 10000.
   */
  maxDelayMs?: number;
  /**
   * Predicate that decides whether a thrown error is retryable.
   * Return `true` to retry, `false` to rethrow immediately.
   * Defaults to retrying all errors.
   */
  isRetryable?: (err: unknown, attempt: number) => boolean;
  /**
   * Optional callback invoked before each retry sleep.
   * Useful for logging or emitting metrics without coupling to a logger.
   */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Run an async operation with exponential backoff retries.
 *
 * The delay between attempts is computed with {@link calculateExponentialBackoffDelay}
 * (full jitter by default), so concurrent callers naturally spread across
 * the retry window and avoid thundering-herd bursts against the API.
 *
 * @example
 * const card = await withRetry({
 *   fn: () => client.createOrder({ amount_usdc: '10.00' }),
 *   maxRetries: 3,
 *   baseDelayMs: 500,
 *   isRetryable: (err) => err instanceof RateLimitError || err instanceof ServiceUnavailableError,
 * });
 *
 * @template T - The resolved value type of the operation.
 * @param opts - Retry configuration.
 * @returns The value returned by `fn` on a successful attempt.
 * @throws The last error thrown by `fn` when all attempts are exhausted,
 *         or immediately if `isRetryable` returns `false`.
 */
export async function withRetry<T>(opts: WithRetryOptions<T>): Promise<T> {
  const maxRetries = opts.maxRetries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const maxDelayMs = opts.maxDelayMs ?? 10000;
  const isRetryable = opts.isRetryable ?? (() => true);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await opts.fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || !isRetryable(err, attempt)) {
        throw err;
      }
      const delayMs = calculateExponentialBackoffDelay({
        attempt,
        baseDelayMs,
        maxDelayMs,
      });
      opts.onRetry?.(err, attempt, delayMs);
      await sleep(delayMs);
    }
  }
  // Unreachable — the loop always returns or throws before exhausting.
  throw lastErr;
}
