'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { shortAddress } from '@/lib/format';

type SolanaProvider = {
  publicKey?: { toString(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<unknown>;
  disconnect?: () => Promise<void>;
  signMessage?: (
    message: Uint8Array,
    display?: string
  ) => Promise<Uint8Array | { signature: Uint8Array }>;
  on?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
};

type WalletDef = {
  id: 'phantom' | 'solflare' | 'backpack';
  name: string;
  accent: string;
  url: string;
  get: () => SolanaProvider | undefined;
};

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider };
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
    solana?: SolanaProvider & { isPhantom?: boolean };
    xnft?: { solana?: SolanaProvider };
  }
}

function readWallet(def: WalletDef): SolanaProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return def.get();
  } catch {
    return undefined;
  }
}

const WALLETS: WalletDef[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    accent: '#ab9ff2',
    url: 'https://phantom.app/download',
    get: () =>
      window.phantom?.solana ??
      (window.solana?.isPhantom ? (window.solana as SolanaProvider) : undefined),
  },
  {
    id: 'solflare',
    name: 'Solflare',
    accent: '#ffbb3d',
    url: 'https://solflare.com/download',
    get: () => window.solflare ?? window.xnft?.solana,
  },
  {
    id: 'backpack',
    name: 'Backpack',
    accent: '#e33e3f',
    url: 'https://backpack.app/download',
    get: () => window.backpack,
  },
];

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

type AuthContextValue = {
  address: string | null;
  loading: boolean;
  openSignIn: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.authenticated && data.address) setAddress(data.address);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openSignIn = useCallback(() => setModalOpen(true), []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // clear the local view even if the request failed
    }
    setAddress(null);
    const phantom = readWallet(WALLETS[0]);
    try {
      await phantom?.disconnect?.();
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ address, loading, openSignIn, signOut }),
    [address, loading, openSignIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} onSignedIn={setAddress} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function WalletModal({
  open,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignedIn: (address: string) => void;
}) {
  const [detected, setDetected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'choose' | 'signing' | 'verifying'>('choose');
  const [activeWallet, setActiveWallet] = useState<string>('phantom');

  useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    for (const wallet of WALLETS) next[wallet.id] = Boolean(readWallet(wallet));
    setDetected(next);
    setBusy(null);
    setError('');
    setStep('choose');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, busy, onClose]);

  async function handleWallet(wallet: WalletDef) {
    const provider = readWallet(wallet);
    if (!provider) {
      window.open(wallet.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setBusy(wallet.id);
    setActiveWallet(wallet.id);
    setError('');
    setStep('signing');
    try {
      const connection = (await provider.connect()) as
        | { publicKey?: { toString(): string } }
        | undefined;
      const address = (
        provider.publicKey?.toString() ||
        connection?.publicKey?.toString() ||
        ''
      ).trim();
      if (!address) throw new Error('Wallet did not return a public key');

      const challengeResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) {
        throw new Error(challenge?.error || 'Could not create a login challenge');
      }
      if (!provider.signMessage) throw new Error('This wallet does not support message signing');

      const encoded = new TextEncoder().encode(challenge.message);
      let signed: Uint8Array | { signature: Uint8Array };
      try {
        signed = await provider.signMessage(encoded, 'utf8');
      } catch {
        signed = await provider.signMessage(encoded);
      }
      const signatureBytes = signed instanceof Uint8Array ? signed : signed?.signature;
      if (!signatureBytes) throw new Error('Wallet did not return a signature');

      setStep('verifying');
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message: challenge.message,
          signature: bytesToBase64(signatureBytes),
          nonceToken: challenge.nonceToken,
        }),
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verified?.error || 'Signature rejected');

      onSignedIn(address);
      onClose();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not sign in';
      if (/reject|cancel|denied/i.test(message)) {
        setError('Signature request cancelled. Nothing was signed and no transaction was sent.');
      } else if (/not been authorized|unauthorized/i.test(message)) {
        setError('Open your wallet, approve this site, then try again.');
      } else {
        setError(message);
      }
      setStep('choose');
    } finally {
      setBusy(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="tx-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="tx-modal tx-modal--auth" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button
          className="tx-modal-close"
          onClick={onClose}
          aria-label="Close sign in"
          type="button"
          disabled={Boolean(busy)}
        >
          ×
        </button>
        <div className="tx-modal-brand">
          <span className="tx-modal-mark" aria-hidden="true">
            ✦
          </span>
          <span className="tx-wordmark">
            tabuline<b>.top</b>
          </span>
        </div>
        <p className="tx-modal-kicker">On-chain authentication</p>
        <h2 id="auth-title" className="tx-modal-title">
          Sign in with your wallet.
        </h2>
        <p className="tx-modal-lead">
          Your Solana wallet is your account. One signature proves you own it — no email, no
          password, no transaction, no gas.
        </p>

        <div className="tx-wallet-list">
          {WALLETS.map((wallet) => {
            const isDetected = detected[wallet.id];
            const isBusy = busy === wallet.id;
            return (
              <button
                key={wallet.id}
                type="button"
                className={`tx-wallet${isBusy ? ' tx-wallet--busy' : ''}`}
                onClick={() => handleWallet(wallet)}
                disabled={Boolean(busy)}
              >
                <span
                  className="tx-wallet-glyph"
                  style={{
                    background: `radial-gradient(circle at 30% 20%, ${wallet.accent}55, ${wallet.accent}18)`,
                    borderColor: `${wallet.accent}66`,
                    color: wallet.accent,
                  }}
                  aria-hidden="true"
                >
                  {wallet.name.slice(0, 1)}
                </span>
                <span className="tx-wallet-copy">
                  <b>{wallet.name}</b>
                  <small>
                    {isBusy
                      ? step === 'verifying'
                        ? 'Verifying signature…'
                        : 'Waiting for signature…'
                      : isDetected
                        ? 'Detected in this browser'
                        : 'Not installed · opens download'}
                  </small>
                </span>
                <span className={`tx-wallet-state${isDetected ? ' tx-wallet-state--live' : ''}`}>
                  {isDetected ? (isBusy ? 'Signing' : 'Connect') : 'Install'}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="tx-error" role="alert">
            {error}
          </div>
        ) : null}

        {busy ? (
          <div className="tx-progress">
            <span className="tx-spinner" aria-hidden="true" />
            <span>
              {step === 'verifying'
                ? 'Verifying the signature against your Solana public key…'
                : 'Approve the sign-in message in your wallet.'}
            </span>
          </div>
        ) : null}

        <p className="tx-footnote">
          The signature is checked server-side with Ed25519 against your wallet&apos;s public key.
          Session keys are bound to this wallet address; nothing is broadcast to the chain.
        </p>
        <div className="tx-auth-meta">
          <span className="tx-dot" /> Solana · mainnet
          <span className="tx-sep">·</span>
          SIWS 1.0
          <span className="tx-sep">·</span>
          <Link href="/docs#program" onClick={onClose}>
            How auth works
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SignInButton({
  className = 'tx-btn tx-btn--solid',
  label = 'Sign in',
  style,
}: {
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  const { address, loading, openSignIn } = useAuth();
  if (loading) {
    return (
      <button className={className} style={style} type="button" disabled aria-busy="true">
        …
      </button>
    );
  }
  if (address) return <WalletMenu />;
  return (
    <button className={className} style={style} type="button" onClick={openSignIn}>
      {label}
    </button>
  );
}

export function WalletMenu() {
  const { address, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!address) return null;

  return (
    <div className="tx-wallet-menu" ref={ref}>
      <button
        type="button"
        className="tx-wallet-chip"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="tx-dot" />
        <span className="tx-wallet-chip-address">{shortAddress(address)}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3 3.5-3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {open ? (
        <div className="tx-wallet-pop" role="menu">
          <div className="tx-wallet-pop-head">
            <span className="tx-dot" />
            <div>
              <b>On-chain identity</b>
              <small>Signature verified</small>
            </div>
          </div>
          <code className="tx-wallet-full">{address}</code>
          <button
            type="button"
            className="tx-menu-item"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                setCopied(false);
              }
            }}
          >
            <span>{copied ? 'Copied' : 'Copy address'}</span>
            <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
          </button>
          <a
            className="tx-menu-item"
            href={`https://solscan.io/account/${address}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>View on Solscan</span>
            <span aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            className="tx-menu-item tx-menu-danger"
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
          >
            <span>Sign out</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
