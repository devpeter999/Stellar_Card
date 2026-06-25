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

export { calculateExponentialBackoffDelay, parseRetryAfterMs, sleep } from './retry';
export type { ExponentialBackoffDelayOptions } from './retry';

export {
  createWallet,
  getBalance,
  addUsdcTrustline,
  payViaContract,
  purchaseCard,
  // Re-export from this barrel to keep external imports stable even if
  // internal module boundaries change later.
  // Back-compat alias for payViaContract.
  payVCC,
} from './stellar';
export type { WalletInfo, PayOpts } from './stellar';

export {
  createOWSWallet,
  importStellarKey,
  getOWSPublicKey,
  getOWSBalance,
  addUsdcTrustlineOWS,
  checkSorobanTxLanded,
  payViaContractOWS,
  purchaseCardOWS,
  onboardAgent,
  // Back-compat alias.
  payVCCOWS,
} from './ows';
export type {
  TrustlineOpts,
  PayViaContractOwsOpts,
  PayVCCOwsOpts,
  PurchaseCardOwsOpts,
  OnboardAgentOpts,
  OnboardAgentResult,
} from './ows';

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

export { InsufficientFeeError } from './soroban';

export { mppCharge } from './mpp';
export type { MppChargeOpts, MppChargeResult } from './mpp';

export { loadStellar_CardConfig, saveStellar_CardConfig, resolveCredentials } from './config';
export type { Stellar_CardConfig } from './config';
