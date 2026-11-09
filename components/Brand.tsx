import Link from 'next/link';
import type { ReactNode } from 'react';

export function Brand({ size = 30 }: { size?: number }) {
  return (
    <span className="tx-brandmark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mark.png" alt="" width={size} height={size} />
      <span className="tx-wordmark">
        tabuline<b>.top</b>
      </span>
    </span>
  );
}

export function Arrow({ children = '→' }: { children?: ReactNode }) {
  return <span aria-hidden="true">{children}</span>;
}

export function BrandLink({
  label = 'Tabuline home',
  size = 30,
}: {
  label?: string;
  size?: number;
}) {
  return (
    <Link href="/" className="tx-brandlink" aria-label={label}>
      <Brand size={size} />
    </Link>
  );
}
