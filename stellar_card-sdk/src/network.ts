/**
 * Network configuration helpers for the stellar_card SDK.
 *
 * These utilities let callers swap out the Soroban RPC and Horizon URLs
 * used by payment functions — useful for custom deployments, private
 * validators, or Futurenet / testnet scenarios.
 */

import { Networks } from '@stellar/stellar-sdk';

/** Well-known Soroban RPC endpoints. */
const MAINNET_RPC = 'https://mainnet.sorobanrpc.com';
const TESTNET_RPC = 'https://soroban-testnet.stellar.org';

/** Well-known Horizon REST endpoints. */
const MAINNET_HORIZON = 'https://horizon.stellar.org';
const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';

/**
 * Full network endpoint configuration.
 *
 * All fields are optional — omitting a field causes the default for the
 * resolved `networkPassphrase` to be used.
 */
export interface NetworkConfig {
  /** Stellar network passphrase. Defaults to `Networks.PUBLIC`. */
  networkPassphrase?: string;
  /** Soroban RPC URL. Defaults to the public mainnet / testnet endpoint. */
  sorobanRpcUrl?: string;
  /** Horizon REST API URL. Defaults to the public mainnet / testnet endpoint. */
  horizonUrl?: string;
}

/**
 * Resolve a `NetworkConfig` object into fully-qualified URLs.
 *
 * Callers can pass a partial config and rely on this function to fill in
 * the public defaults for the selected network passphrase.
 */
export function resolveNetworkConfig(config: NetworkConfig = {}): Required<NetworkConfig> {
  const networkPassphrase = config.networkPassphrase ?? Networks.PUBLIC;
  const isTestnet = networkPassphrase === Networks.TESTNET;
  return {
    networkPassphrase,
    sorobanRpcUrl: config.sorobanRpcUrl ?? (isTestnet ? TESTNET_RPC : MAINNET_RPC),
    horizonUrl: config.horizonUrl ?? (isTestnet ? TESTNET_HORIZON : MAINNET_HORIZON),
  };
}

/**
 * Return the default Soroban RPC URL for a given network passphrase.
 * Exposed so callers can derive the URL without constructing a full config.
 */
export function getDefaultSorobanRpcUrl(networkPassphrase = Networks.PUBLIC): string {
  return networkPassphrase === Networks.TESTNET ? TESTNET_RPC : MAINNET_RPC;
}

/**
 * Return the default Horizon URL for a given network passphrase.
 * Exposed so callers can derive the URL without constructing a full config.
 */
export function getDefaultHorizonUrl(networkPassphrase = Networks.PUBLIC): string {
  return networkPassphrase === Networks.TESTNET ? TESTNET_HORIZON : MAINNET_HORIZON;
}
