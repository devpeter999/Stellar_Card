/**
 * Comprehensive TypeScript type definitions for the stellar_card SDK.
 * 
 * This module provides all the core types, interfaces, and type guards
 * used across the SDK for type-safe interactions with the stellar_card API.
 */

// ============================================================================
// NETWORK & CONFIGURATION TYPES
// ============================================================================

/** Supported Stellar network identifiers */
export type NetworkType = 'mainnet' | 'testnet' | 'futurenet' | 'custom';

/** RPC endpoint configuration */
export interface RpcEndpoint {
  /** Soroban RPC URL */
  url: string;
  /** Optional request timeout in milliseconds */
  timeout?: number;
  /** Optional API key for authenticated RPC endpoints */
  apiKey?: string;
}

/** Complete network configuration with custom endpoints */
export interface ExtendedNetworkConfig {
  /** Network passphrase (e.g., Networks.PUBLIC) */
  networkPassphrase: string;
  /** Soroban RPC configuration */
  sorobanRpc: RpcEndpoint;
  /** Horizon REST API configuration */
  horizon: RpcEndpoint;
  /** Optional friendly name for the network */
  name?: string;
}

// ============================================================================
// API CLIENT TYPES
// ============================================================================

/** HTTP method types */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** HTTP request headers */
export interface HttpHeaders {
  [key: string]: string;
}

/** HTTP request options */
export interface HttpRequestOptions {
  method: HttpMethod;
  headers?: HttpHeaders;
  body?: string;
  signal?: AbortSignal;
  timeout?: number;
}

/** HTTP response wrapper */
export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: HttpHeaders;
  data: T;
}

// ============================================================================
// WALLET & TRANSACTION TYPES
// ============================================================================

/** Wallet keypair information */
export interface WalletKeypair {
  /** Stellar public key (G...) */
  publicKey: string;
  /** Stellar secret key (S...) - keep secure */
  secret: string;
}

/** OWS wallet metadata */
export interface OWSWalletMetadata {
  /** Unique wallet identifier */
  walletId: string;
  /** Wallet name */
  name: string;
  /** Stellar public key */
  publicKey: string;
  /** Vault file path */
  vaultPath?: string;
  /** Whether the wallet is encrypted */
  encrypted: boolean;
}

/** Transaction simulation result */
export interface TransactionSimulation {
  /** Estimated fee in stroops */
  fee: string;
  /** Resource usage estimation */
  resources: {
    cpuInstructions: number;
    readBytes: number;
    writeBytes: number;
  };
  /** Whether simulation succeeded */
  success: boolean;
  /** Simulation error if any */
  error?: string;
}

/** Transaction submission result */
export interface TransactionResult {
  /** Transaction hash */
  hash: string;
  /** Ledger number where tx was included */
  ledger: number;
  /** Whether transaction succeeded */
  successful: boolean;
  /** Result XDR */
  resultXdr?: string;
}

// ============================================================================
// PAYMENT & ORDER TYPES
// ============================================================================

/** Payment asset types */
export type PaymentAsset = 'usdc' | 'xlm';

/** Order creation parameters */
export interface OrderCreationParams {
  /** Amount in USDC (decimal string like "10.00") */
  amount_usdc: string;
  /** Optional webhook URL for order status updates */
  webhook_url?: string;
  /** Optional metadata attached to the order */
  metadata?: Record<string, unknown>;
  /** Optional idempotency key */
  idempotency_key?: string;
}

/** Payment quote details */
export interface PaymentQuote {
  /** Quoted amount (decimal string) */
  amount: string;
  /** Asset identifier (e.g., "USDC:issuer" or just "XLM") */
  asset: string;
  /** Exchange rate if applicable */
  rate?: string;
  /** Quote expiration timestamp */
  expiresAt?: string;
}

/** Extended payment instructions with validation */
export interface ExtendedPaymentInstructions {
  /** Payment model type */
  type: 'soroban_contract';
  /** Contract address (C...) */
  contract_id: string;
  /** Order ID to include in payment */
  order_id: string;
  /** USDC payment quote */
  usdc: PaymentQuote;
  /** Optional XLM payment quote */
  xlm?: PaymentQuote;
  /** Network passphrase for the payment */
  networkPassphrase?: string;
  /** Deadline timestamp for payment */
  deadline?: string;
}

// ============================================================================
// ORDER STATUS & LIFECYCLE TYPES
// ============================================================================

/** Detailed order phase with substates */
export type DetailedOrderPhase =
  | 'awaiting_approval'
  | 'awaiting_payment'
  | 'payment_received'
  | 'processing'
  | 'fulfilling'
  | 'ready'
  | 'delivered'
  | 'failed'
  | 'refunded'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/** Order status history entry */
export interface OrderStatusHistory {
  /** Status at this point */
  status: string;
  /** Phase at this point */
  phase: DetailedOrderPhase;
  /** Timestamp of status change */
  timestamp: string;
  /** Optional note about the change */
  note?: string;
}

/** Extended order status with history */
export interface ExtendedOrderStatus {
  /** Order identifier */
  order_id: string;
  /** Current status string */
  status: string;
  /** Current lifecycle phase */
  phase: DetailedOrderPhase;
  /** Ordered amount in USDC */
  amount_usdc: string;
  /** Payment asset used */
  payment_asset: PaymentAsset;
  /** Card details if ready */
  card?: {
    number: string;
    cvv: string;
    expiry: string;
    brand: string | null;
  };
  /** Error message if failed */
  error?: string;
  /** Additional notes */
  note?: string;
  /** Refund info if applicable */
  refund?: {
    stellar_txid: string;
    amount: string;
    asset: string;
  };
  /** Payment instructions if pending */
  payment?: ExtendedPaymentInstructions;
  /** Order creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Status change history */
  history?: OrderStatusHistory[];
}

// ============================================================================
// BUDGET & USAGE TYPES
// ============================================================================

/** Detailed budget information */
export interface DetailedBudget {
  /** Total spent in USDC */
  spent_usdc: string;
  /** In-flight orders amount */
  in_flight_usdc: string;
  /** Total committed (spent + in-flight) */
  committed_usdc: string;
  /** Spend limit or null if unlimited */
  limit_usdc: string | null;
  /** Remaining budget or null if unlimited */
  remaining_usdc: string | null;
  /** Budget period (e.g., "monthly", "lifetime") */
  period?: string;
  /** Period start timestamp */
  period_start?: string;
  /** Period end timestamp */
  period_end?: string;
}

/** Order statistics */
export interface OrderStatistics {
  /** Total order count */
  total: number;
  /** Delivered orders */
  delivered: number;
  /** Failed orders */
  failed: number;
  /** Refunded orders */
  refunded: number;
  /** In-progress orders */
  in_progress: number;
  /** Average completion time in seconds */
  avg_completion_time?: number;
  /** Success rate (0-1) */
  success_rate?: number;
}

/** Extended usage summary with analytics */
export interface ExtendedUsageSummary {
  /** API key identifier */
  api_key_id: string;
  /** Optional label for the key */
  label: string | null;
  /** Budget information */
  budget: DetailedBudget;
  /** Order statistics */
  orders: OrderStatistics;
  /** Last activity timestamp */
  last_activity?: string;
  /** Account creation timestamp */
  created_at?: string;
}

// ============================================================================
// ERROR & RETRY TYPES
// ============================================================================

/** Error severity levels */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/** Extended error context */
export interface ExtendedErrorContext {
  /** Error source component */
  source?: string;
  /** Operation being attempted */
  operation?: string;
  /** Root cause error */
  cause?: Error;
  /** Suggested recovery action */
  recoveryHint?: string;
  /** Error-specific metadata */
  metadata?: Record<string, unknown>;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Whether error is retryable */
  retryable?: boolean;
  /** Retry attempt number */
  retryAttempt?: number;
}

/** Retry strategy configuration */
export interface RetryStrategy {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Base delay between retries */
  baseDelayMs: number;
  /** Maximum delay cap */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Whether to use jitter */
  useJitter: boolean;
  /** Custom retry condition */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

// ============================================================================
// PAGINATION & FILTERING TYPES
// ============================================================================

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort options */
export interface SortOptions {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: SortDirection;
}

/** Filter operator */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';

/** Filter condition */
export interface FilterCondition {
  /** Field to filter on */
  field: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: unknown;
}

/** Advanced list options with filtering */
export interface AdvancedListOptions {
  /** Status filter */
  status?: string;
  /** Page limit */
  limit?: number;
  /** Page offset */
  offset?: number;
  /** Filter by creation time */
  since_created_at?: string;
  /** Filter by update time */
  since_updated_at?: string;
  /** Sort options */
  sort?: SortOptions;
  /** Additional filters */
  filters?: FilterCondition[];
  /** Include related resources */
  include?: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/** Type guard for PaymentAsset */
export function isPaymentAsset(value: unknown): value is PaymentAsset {
  return value === 'usdc' || value === 'xlm';
}

/** Type guard for OrderPhase */
export function isOrderPhase(value: unknown): value is DetailedOrderPhase {
  const phases: DetailedOrderPhase[] = [
    'awaiting_approval',
    'awaiting_payment',
    'payment_received',
    'processing',
    'fulfilling',
    'ready',
    'delivered',
    'failed',
    'refunded',
    'rejected',
    'expired',
    'cancelled',
  ];
  return typeof value === 'string' && phases.includes(value as DetailedOrderPhase);
}

/** Type guard for NetworkType */
export function isNetworkType(value: unknown): value is NetworkType {
  return (
    value === 'mainnet' ||
    value === 'testnet' ||
    value === 'futurenet' ||
    value === 'custom'
  );
}

/** Type guard to check if error has a specific code */
export function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === code
  );
}

/** Type guard to check if error is retryable */
export function isRetryableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { status?: number; code?: string; retryable?: boolean };
  if (typeof err.retryable === 'boolean') return err.retryable;
  if (typeof err.status === 'number') {
    return err.status === 429 || err.status === 502 || err.status === 503 || err.status === 504;
  }
  return false;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Make all properties of T required and non-nullable */
export type DeepRequired<T> = {
  [P in keyof T]-?: DeepRequired<NonNullable<T[P]>>;
};

/** Make all properties of T optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Extract keys of T that are of type U */
export type KeysOfType<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T];

/** Async version of a function type */
export type AsyncFunction<T extends (...args: never[]) => unknown> = (
  ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>;

/** Callback function type */
export type Callback<T = void, E = Error> = (error: E | null, result?: T) => void;

/** Event emitter interface */
export interface EventEmitter<Events extends Record<string, unknown[]>> {
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): void;
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, ...args: Events[K]): void;
}
