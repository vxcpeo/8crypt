import type { ReactNode } from 'react';

/**
 * Content component: the brand lockup. The wordmark is deliberately split into
 * two text nodes (`gemmora` + `.xyz`) so the product name and the domain stay
 * separate tokens, exactly as in the content contract.
 */
export function Brand({ size = 24 }: { size?: number }) {
  return (
    <span className="gx-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gx-brandmark" src="/mark.png" alt="" width={size} height={size} />
      <span className="gx-wordmark">
        gemmora<b>.xyz</b>
      </span>
    </span>
  );
}

export function Arrow({ children = '→' }: { children?: ReactNode }) {
  return <span aria-hidden="true">{children}</span>;
}
