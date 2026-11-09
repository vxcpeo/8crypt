import Link from 'next/link';
import type { ReactNode } from 'react';
import { X_HANDLE, X_URL } from '@/lib/links';
import { Brand } from './Brand';
import { XIcon } from './Icons';

const MARKETING_LINKS = [
  { href: '/app', label: 'Swap' },
  { href: '/offers', label: 'Offers' },
  { href: '/#how', label: 'How it works' },
  { href: '/#token', label: '$TABULINE' },
  { href: '/docs', label: 'Docs' },
];

const PRODUCT_LINKS = [
  { href: '/app', label: 'Swap' },
  { href: '/offers', label: 'Offers' },
  { href: '/docs', label: 'Docs' },
];

export function SplitLayout({
  narrative,
  children,
  footer,
  variant = 'marketing',
}: {
  narrative: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'marketing' | 'product';
}) {
  return (
    <div className={`tx-shell tx-shell--${variant}`}>
      <aside className="tx-aside">
        <div className="tx-aside-inner">{narrative}</div>
      </aside>
      <div className="tx-stage">
        <main className="tx-main" id="content">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}

export function XIconLink() {
  return (
    <a
      className="tx-xbtn"
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Tabuline on X, ${X_HANDLE}`}
      title={`${X_HANDLE} on X`}
    >
      <XIcon size={15} />
    </a>
  );
}

export function BrandBar({
  label = 'Tabuline home',
  children,
}: {
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div className="tx-brandbar">
      <Link href="/" className="tx-brandlink" aria-label={label}>
        <Brand size={34} />
      </Link>
      <div className="tx-brandbar-actions">
        <XIconLink />
        {children}
      </div>
    </div>
  );
}

export function IndexNav({
  active,
  variant = 'marketing',
}: {
  active?: string;
  variant?: 'marketing' | 'product';
}) {
  const links = variant === 'product' ? PRODUCT_LINKS : MARKETING_LINKS;
  return (
    <nav className="tx-index" aria-label={variant === 'product' ? 'App' : 'Primary'}>
      <ol className="tx-index-list">
        {links.map((link, index) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="tx-index-link"
              aria-current={active === link.href ? 'page' : undefined}
            >
              <span className="tx-index-num">{String(index + 1).padStart(2, '0')}</span>
              <span className="tx-index-label">{link.label}</span>
              <span className="tx-index-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function XFollowChip({ suffix = 'on X' }: { suffix?: string }) {
  return (
    <a
      className="tx-chip tx-chip--x"
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Tabuline on X, ${X_HANDLE}`}
    >
      <XIcon size={11} />
      <b>{X_HANDLE}</b>
      <span>{suffix}</span>
      <span className="tx-chip-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="tx-footer" aria-label="Footer">
      <div className="tx-footer-grid">
        <div className="tx-footer-brand">
          <Brand size={30} />
          <p>Card-for-card swaps for Collector Crypt cards on Solana.</p>
          <XFollowChip />
        </div>
        <div className="tx-footer-cols">
          <div className="tx-footer-col">
            <b>Product</b>
            <Link href="/app">Swap</Link>
            <Link href="/offers">Offers</Link>
            <Link href="/docs">Docs</Link>
          </div>
          <div className="tx-footer-col">
            <b>Protocol</b>
            <Link href="/#how">How it works</Link>
            <Link href="/#fees">Fees</Link>
            <Link href="/#risks">Risks</Link>
          </div>
          <div className="tx-footer-col">
            <b>Elsewhere</b>
            <a href={X_URL} target="_blank" rel="noreferrer">
              x.com/{X_HANDLE.replace('@', '')} ↗
            </a>
            <a
              href="https://solscan.io/account/5wvjqDcFDVri7RUcxn1TQA7MPRjWJ7gMvY2DabbyJCW6"
              target="_blank"
              rel="noreferrer"
            >
              Program 5wvj…JCW6
            </a>
          </div>
        </div>
      </div>
      <p className="tx-legal">
        Not affiliated with Collector Crypt or The Pokémon Company. Not financial advice. The
        program is not audited. Card values are Collector Crypt&apos;s estimates.
      </p>
    </footer>
  );
}
