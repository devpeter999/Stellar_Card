import { describe, it, expect } from 'vitest';
import { Networks } from '@stellar/stellar-sdk';
import {
  resolveNetworkConfig,
  getDefaultSorobanRpcUrl,
  getDefaultHorizonUrl,
} from '../network';

describe('resolveNetworkConfig', () => {
  it('defaults to PUBLIC network with mainnet endpoints', () => {
    const cfg = resolveNetworkConfig();
    expect(cfg.networkPassphrase).toBe(Networks.PUBLIC);
    expect(cfg.sorobanRpcUrl).toBe('https://mainnet.sorobanrpc.com');
    expect(cfg.horizonUrl).toBe('https://horizon.stellar.org');
  });

  it('resolves testnet defaults for Networks.TESTNET', () => {
    const cfg = resolveNetworkConfig({ networkPassphrase: Networks.TESTNET });
    expect(cfg.sorobanRpcUrl).toBe('https://soroban-testnet.stellar.org');
    expect(cfg.horizonUrl).toBe('https://horizon-testnet.stellar.org');
  });

  it('respects explicit sorobanRpcUrl override', () => {
    const cfg = resolveNetworkConfig({
      networkPassphrase: Networks.PUBLIC,
      sorobanRpcUrl: 'https://my-custom-rpc.example.com',
    });
    expect(cfg.sorobanRpcUrl).toBe('https://my-custom-rpc.example.com');
    expect(cfg.horizonUrl).toBe('https://horizon.stellar.org');
  });

  it('respects explicit horizonUrl override', () => {
    const cfg = resolveNetworkConfig({
      networkPassphrase: Networks.PUBLIC,
      horizonUrl: 'https://my-horizon.example.com',
    });
    expect(cfg.horizonUrl).toBe('https://my-horizon.example.com');
    expect(cfg.sorobanRpcUrl).toBe('https://mainnet.sorobanrpc.com');
  });

  it('allows both overrides simultaneously', () => {
    const cfg = resolveNetworkConfig({
      sorobanRpcUrl: 'https://rpc.custom.net',
      horizonUrl: 'https://horizon.custom.net',
    });
    expect(cfg.sorobanRpcUrl).toBe('https://rpc.custom.net');
    expect(cfg.horizonUrl).toBe('https://horizon.custom.net');
  });
});

describe('getDefaultSorobanRpcUrl', () => {
  it('returns mainnet RPC for PUBLIC passphrase', () => {
    expect(getDefaultSorobanRpcUrl(Networks.PUBLIC)).toBe('https://mainnet.sorobanrpc.com');
  });

  it('returns testnet RPC for TESTNET passphrase', () => {
    expect(getDefaultSorobanRpcUrl(Networks.TESTNET)).toBe(
      'https://soroban-testnet.stellar.org',
    );
  });

  it('defaults to mainnet when no passphrase given', () => {
    expect(getDefaultSorobanRpcUrl()).toBe('https://mainnet.sorobanrpc.com');
  });
});

describe('getDefaultHorizonUrl', () => {
  it('returns mainnet Horizon for PUBLIC passphrase', () => {
    expect(getDefaultHorizonUrl(Networks.PUBLIC)).toBe('https://horizon.stellar.org');
  });

  it('returns testnet Horizon for TESTNET passphrase', () => {
    expect(getDefaultHorizonUrl(Networks.TESTNET)).toBe('https://horizon-testnet.stellar.org');
  });

  it('defaults to mainnet when no passphrase given', () => {
    expect(getDefaultHorizonUrl()).toBe('https://horizon.stellar.org');
  });
});
