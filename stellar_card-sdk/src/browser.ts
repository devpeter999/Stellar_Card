/**
 * Browser-safe entry point for the stellar_card SDK.
 *
 * This module exports only the subset of the SDK that works in browser
 * environments.  Node.js-only modules that depend on `fs`, `os`, `path`,
 * or native binaries (config loading, CLI, OWS wallet) are intentionally
 * excluded.
 *
 * Usage:
 *   import { Stellar_CardClient } from 'stellar_card/browser';
 */

// REST API client — uses the global `fetch` available in all modern browsers.
export { Stellar_CardClient } from './client';
export type {
  OrderOptions,
  CreateOrderOptions,
  OrderResponse,
  OrderStatus,
  OrderListItem,
  OrderPhase,
  CardDetails,
  PaymentInstructions,
  Budget,
  UsageSummary,
  RetryOptions,
  WaitForCardOptions,
  ListOrdersOptions,
  ListOrdersPage,
  IterateOrdersOptions,
  ReportStatusOptions,
  StellarCardClientOptions,
} from './client';

// Retry utilities — pure functions, no Node.js deps.
export { calculateExponentialBackoffDelay, parseRetryAfterMs, sleep } from './retry';
export type { ExponentialBackoffDelayOptions } from './retry';

// Pagination utilities — pure functions, no Node.js deps.
export {
  paginate,
  iteratePages,
} from './pagination';
export type {
  PaginationCursor,
  PaginatedResult,
  PaginateOptions,
  IteratePagesOptions,
} from './pagination';

// Network configuration helpers — pure functions, no Node.js deps.
export {
  resolveNetworkConfig,
  getDefaultSorobanRpcUrl,
  getDefaultHorizonUrl,
} from './network';
export type { NetworkConfig } from './network';

// Structured error types — pure classes, no Node.js deps.
export {
  Stellar_CardError,
  SpendLimitError,
  RateLimitError,
  ServiceUnavailableError,
  PriceUnavailableError,
  InvalidAmountError,
  AuthError,
  OrderFailedError,
  WaitTimeoutError,
  ResumableError,
  NetworkError,
  TimeoutError,
  ValidationError,
  SorobanRpcError,
  HorizonError,
  WalletError,
  parseApiError,
  wrapError,
  wrapNetworkError,
  wrapTimeoutError,
  wrapSorobanError,
  wrapHorizonError,
  wrapWalletError,
  type ErrorContext,
} from './errors';
