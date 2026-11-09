import Link from 'next/link';
import { BrandBar, IndexNav, SiteFooter, SplitLayout } from '@/components/Tidal';

export default function NotFound() {
  return (
    <SplitLayout
      variant="marketing"
      footer={<SiteFooter />}
      narrative={
        <>
          <BrandBar />
          <IndexNav />
          <div className="tx-thesis">
            <p className="tx-eyebrow">404</p>
            <h1 className="tx-display tx-display--doc">
              This slab is not <em>in the vault.</em>
            </h1>
          </div>
        </>
      }
    >
      <section className="tx-band tx-band--first">
        <p className="tx-copy">
          The card or page you are looking for does not exist. Head back to the swap desk and
          browse the verified Collector Crypt catalog.
        </p>
        <div className="tx-actions">
          <Link className="tx-btn tx-btn--solid" href="/app">
            Browse cards <span aria-hidden="true">→</span>
          </Link>
          <Link className="tx-btn tx-btn--ghost" href="/">
            Back home
          </Link>
        </div>
      </section>
    </SplitLayout>
  );
}
