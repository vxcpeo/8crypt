import Link from 'next/link';
import {
  CommandLine,
  Console,
  ConsoleFooter,
  StatusBar,
  Work,
} from '@/components/Console';

export default function NotFound() {
  return (
    <Console>
      <StatusBar />
      <CommandLine
        label={
          <>
            <span className="gx-dot" aria-hidden="true" />
            404
          </>
        }
        title={
          <>
            This slab is not <em>in the vault.</em>
          </>
        }
      />

      <Work layout="one">
        <main className="gx-pane gx-pane--data" id="content">
          <section className="gx-band">
            <p className="gx-copy">
              The card or page you are looking for does not exist. Head back to the swap desk and
              browse the verified Collector Crypt catalog.
            </p>
            <div className="gx-actions">
              <Link className="gx-btn gx-btn--primary" href="/app">
                Browse cards <span aria-hidden="true">→</span>
              </Link>
              <Link className="gx-btn gx-btn--ghost" href="/">
                Back home
              </Link>
            </div>
          </section>
        </main>
      </Work>

      <ConsoleFooter />
    </Console>
  );
}
