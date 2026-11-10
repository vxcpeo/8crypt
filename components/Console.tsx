import Link from 'next/link';
import type { ReactNode } from 'react';
import { X_HANDLE, X_URL } from '@/lib/links';
import { Brand } from './Brand';
import { XIcon } from './Icons';

const MARKETING_COMMANDS = [
  { href: '/app', label: 'Swap' },
  { href: '/offers', label: 'Offers' },
  { href: '/#how', label: 'How it works' },
  { href: '/#token', label: '$GEMMORA' },
  { href: '/docs', label: 'Docs' },
];

const PRODUCT_COMMANDS = [
  { href: '/app', label: 'Swap' },
  { href: '/offers', label: 'Offers' },
  { href: '/docs', label: 'Docs' },
];

/** Root console frame: status bar, command line, panes, hint strip. */
export function Console({ children }: { children: ReactNode }) {
  return <div className="gx-console">{children}</div>;
}

export function XIconLink() {
  return (
    <a
      className="gx-xlink"
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Gemmora on X, ${X_HANDLE}`}
      title={`${X_HANDLE} on X`}
    >
      <XIcon size={13} />
    </a>
  );
}

export function CommandNav({
  active,
  variant = 'marketing',
}: {
  active?: string;
  variant?: 'marketing' | 'product';
}) {
  const commands = variant === 'product' ? PRODUCT_COMMANDS : MARKETING_COMMANDS;
  return (
    <nav className="gx-commands" aria-label={variant === 'product' ? 'App' : 'Primary'}>
      {commands.map((command, index) => (
        <Link
          key={command.href}
          href={command.href}
          className="gx-command"
          aria-current={active === command.href ? 'page' : undefined}
        >
          <span className="gx-command-num" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="gx-command-label">{command.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** 30px status bar pinned to the top of every route. */
export function StatusBar({
  active,
  variant = 'marketing',
  action,
  label = 'Gemmora home',
}: {
  active?: string;
  variant?: 'marketing' | 'product';
  action?: ReactNode;
  label?: string;
}) {
  return (
    <header className="gx-status">
      <Link href="/" className="gx-sig" aria-label={label}>
        <Brand size={20} />
      </Link>
      <CommandNav variant={variant} active={active} />
      <div className="gx-status-tail">
        <XIconLink />
        {action}
      </div>
    </header>
  );
}

/** Full-bleed command header: eyebrow, running head, lede, actions, meta. */
export function CommandLine({
  label,
  title,
  lede,
  actions,
  meta,
  aside,
}: {
  label?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="gx-cmdline">
      <div className="gx-cmdline-main">
        {label ? <p className="gx-eyebrow">{label}</p> : null}
        <h1 className="gx-title">{title}</h1>
        {lede ? <p className="gx-lede">{lede}</p> : null}
        {actions ? <div className="gx-actions">{actions}</div> : null}
        {meta ? <div className="gx-meta">{meta}</div> : null}
      </div>
      {aside ? <div className="gx-cmdline-aside">{aside}</div> : null}
    </section>
  );
}

/** Console body: one, two or three hairline-separated panes. */
export function Work({
  children,
  layout = 'three',
}: {
  children: ReactNode;
  layout?: 'three' | 'two' | 'one';
}) {
  return <div className={`gx-work gx-work--${layout}`}>{children}</div>;
}

export function IndexPane({ children }: { children: ReactNode }) {
  return <div className="gx-pane gx-pane--index">{children}</div>;
}

export function SpecPane({ children }: { children: ReactNode }) {
  return <div className="gx-pane gx-pane--spec">{children}</div>;
}

export function XPostChip({ suffix = 'on X' }: { suffix?: string }) {
  return (
    <a
      className="gx-chip"
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Gemmora on X, ${X_HANDLE}`}
    >
      <XIcon size={11} />
      <b>{X_HANDLE}</b>
      <span>{suffix}</span>
      <span className="gx-chip-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export function ConsoleFooter() {
  return (
    <footer className="gx-hints" aria-label="Footer">
      <div className="gx-hints-brand">
        <Brand size={24} />
        <p>Card-for-card swaps for Collector Crypt cards on Solana.</p>
        <XPostChip />
      </div>
      <nav className="gx-hints-cols" aria-label="Footer">
        <div className="gx-hints-col">
          <b>Product</b>
          <Link href="/app">Swap</Link>
          <Link href="/offers">Offers</Link>
          <Link href="/docs">Docs</Link>
        </div>
        <div className="gx-hints-col">
          <b>Protocol</b>
          <Link href="/#how">How it works</Link>
          <Link href="/#fees">Fees</Link>
          <Link href="/#risks">Risks</Link>
        </div>
        <div className="gx-hints-col">
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
      </nav>
      <p className="gx-legal">
        Not affiliated with Collector Crypt or The Pokémon Company. Not financial advice. The
        program is not audited. Card values are Collector Crypt&apos;s estimates.
      </p>
    </footer>
  );
}

/** Slim status strip that closes product routes. */
export function StatusFoot() {
  return (
    <footer className="gx-statusfoot" aria-label="Status">
      <span className="gx-tick" aria-hidden="true">
        ⇄
      </span>
      <span className="gx-tick" aria-hidden="true">
        ⇄
      </span>
      <span className="gx-tick" aria-hidden="true">
        ⇄
      </span>
      <span className="gx-tick" aria-hidden="true">
        →
      </span>
    </footer>
  );
}
