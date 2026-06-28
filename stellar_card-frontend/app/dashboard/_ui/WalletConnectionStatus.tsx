// Wallet connection status indicator component.
// Displays the current wallet connection state with appropriate
// visual feedback and action buttons.

'use client';

import type { WalletConnectionState } from '../_lib/walletConnection';
import { getWalletStateLabel, getWalletStateColor } from '../_lib/walletConnection';

interface Props {
  state: WalletConnectionState;
  publicKey?: string | null;
  network?: 'mainnet' | 'testnet' | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}

export function WalletConnectionStatus({
  state,
  publicKey,
  network,
  onConnect,
  onDisconnect,
  onRetry,
  compact = false,
}: Props) {
  const color = getWalletStateColor(state);
  const label = getWalletStateLabel(state);

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
        }}
        role="status"
        aria-live="polite"
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            boxShadow: state === 'connected' ? '0 0 8px var(--green-glow)' : 'none',
          }}
          aria-hidden="true"
        />
        <span style={{ color: 'var(--fg-muted)' }}>{label}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: state === 'connected' ? '0 0 10px var(--green-glow)' : 'none',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--fg)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {label}
          </span>
        </div>
        {network && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--fg-dim)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            {network}
          </span>
        )}
      </div>

      {publicKey && (
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--fg-dim)',
            fontFamily: 'var(--font-mono)',
            wordBreak: 'break-all',
          }}
        >
          {publicKey.slice(0, 8)}...{publicKey.slice(-4)}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {state === 'disconnected' && onConnect && (
          <button
            onClick={onConnect}
            type="button"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              background: 'var(--green-muted)',
              color: 'var(--green)',
              border: '1px solid var(--green-border)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 120ms, border-color 120ms',
            }}
          >
            Connect Wallet
          </button>
        )}
        {state === 'connected' && onDisconnect && (
          <button
            onClick={onDisconnect}
            type="button"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              background: 'var(--surface)',
              color: 'var(--fg-muted)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 120ms, border-color 120ms',
            }}
          >
            Disconnect
          </button>
        )}
        {(state === 'error' || state === 'network_mismatch') && onRetry && (
          <button
            onClick={onRetry}
            type="button"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              background: 'var(--surface)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 120ms, border-color 120ms',
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
