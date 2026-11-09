'use client';

import Link from 'next/link';
import { Brand } from './Brand';
import { SignInButton } from './auth';

export function AppHeader() {
  return (
    <header className="oe3DtG_appNav">
      <div className="oe3DtG_navInner">
        <Link href="/" aria-label="Home">
          <Brand size={28} />
        </Link>
        <nav className="oe3DtG_navLinks" aria-label="App">
          <Link href="/app">Swap</Link>
          <Link href="/offers">Offers</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <SignInButton
          className="oe3DtG_btnRed"
          style={{ height: 42, padding: '0 20px', fontSize: 14 }}
        />
      </div>
    </header>
  );
}

export function AppBackdrop() {
  return (
    <div className="-p15RG_backdrop" aria-hidden="true">
      <div className="cf-backdrop-glow" />
    </div>
  );
}
