import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from './Brand';

const MARKETING_LINKS = [
  { href: '/app', label: 'Swap' },
  { href: '/offers', label: 'Offers' },
  { href: '/#how', label: 'How it works' },
  { href: '/#token', label: '$GRADIX' },
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

export function BrandBar({
  label = 'Gradix home',
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
      {children}
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

export function SoonChip() {
  return (
    <span className="tx-chip">
      <b>$GRADIX</b>
      <span>CA soon</span>
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="tx-footer" aria-label="Footer">
      <div className="tx-footer-grid">
        <div className="tx-footer-brand">
          <Brand size={30} />
          <p>Card-for-card swaps for Collector Crypt cards on Solana.</p>
          <SoonChip />
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
