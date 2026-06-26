// Browser-safe entry point for the stellar_card SDK.
//
// Only exports modules that are safe to use in browser environments:
//   - Stellar_CardClient: HTTP API client (uses fetch / Web Crypto / SSE)
//   - Error classes: pure-JS typed errors with no platform dependencies
//
// Intentionally excluded (Node.js / native-only):
//   - config.ts     — uses fs, path, os, crypto for ~/.stellar_card/config.json
//   - stellar.ts    — Horizon RPC helpers, heavy stellar-sdk surface area
//   - ows.ts        — @ctx.com/stellar-ows-core has native Linux/Darwin binaries
//   - soroban.ts    — pulled in transitively by stellar.ts / ows.ts
//   - mpp.ts        — depends on ows.ts (payViaContractOWS)
//   - mcp.ts        — MCP server uses Node.js stdio transport
//   - cli.ts        — CLI uses process.argv / readline / Node.js I/O
//
// Browser consumers pass credentials directly to the constructor:
//   const client = new Stellar_CardClient({ apiKey: '...', baseUrl: '...' });

export { Stellar_CardClient } from './client';
export type {
  OrderOptions,
  OrderResponse,
  OrderStatus,
  OrderListItem,
  OrderPhase,
  CardDetails,
  PaymentInstructions,
  Budget,
  UsageSummary,
} from './client';

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
} from './errors';
