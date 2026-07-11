import Teaser from "@/components/Teaser";

const DODO_CHECKOUT_URL = "https://test.dodopayments.com/checkout/pdt_0NixA6oHtXHfSCvoDJUdS";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-5 py-14 sm:py-20">
        <header className="mb-10 flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
          <span className="text-sm font-semibold tracking-tight">Assemble</span>
        </header>

        <section className="mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--good)]" />
            AI that builds your founding team
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Turn an idea into a{" "}
            <span className="gradient-text">founding team</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted)]">
            Describe what you want to build. Assemble decomposes it into the
            expertise you&apos;re missing, finds the real people who fit, explains
            every match, and drafts the outreach.
          </p>
        </section>

        <Teaser />

        <footer className="mt-20 text-center text-xs text-[var(--muted)]">
          <div className="mx-auto mb-4 grid max-w-md grid-cols-3 gap-2 text-[11px]">
            <Step n="1" label="Decompose the idea" />
            <Step n="2" label="Source real people" />
            <Step n="3" label="Draft the outreach" />
          </div>
          Built at the Hermes Buildathon · Assemble
        </footer>
      </main>

      {/* Sidebar — Plan status */}
      <aside className="hidden lg:flex w-[280px] flex-col border-l border-[var(--border)] bg-[var(--bg-2)]/60 px-5 py-8 backdrop-blur-sm">
        {/* Connected badge */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--good)] opacity-75" />
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--good)]" />
            </span>
            <span className="text-xs font-medium text-[var(--good)]">Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Pro
            </span>
            <span className="text-sm font-semibold">Plan</span>
          </div>
        </div>

        {/* Current plan features */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Your plan includes</p>
          <ul className="space-y-2">
            <PlanFeature active label="1 idea at a time" />
            <PlanFeature active label="3 profile matches" />
            <PlanFeature active label="Outreach to 1 profile" />
            <PlanFeature active label="Voice agent demo" />
          </ul>
        </div>

        <div className="h-px bg-[var(--border)] my-4" />

        {/* Upgrade CTA */}
        <div className="flex-1">
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Business
              </span>
              <span className="text-xs text-[var(--muted)]">Upgrade</span>
            </div>
            <p className="text-sm font-semibold mb-2">Unlock full power</p>
            <ul className="space-y-1.5 mb-4">
              <PlanFeature upcoming label="Unlimited ideas" />
              <PlanFeature upcoming label="5 profile suggestions" />
              <PlanFeature upcoming label="Outreach to 3 profiles" />
              <PlanFeature upcoming label="Priority matching" />
            </ul>
            <a
              href={DODO_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline transition-all hover:shadow-[0_8px_24px_-6px_rgba(245,158,11,0.5)] hover:translate-y-[-1px]"
            >
              Upgrade to Business →
            </a>
            <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
              Powered by Dodo Payments
            </p>
          </div>
        </div>

        {/* User info */}
        <div className="mt-auto pt-6 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-[10px] font-bold">
              AB
            </div>
            <div>
              <p className="text-xs font-semibold">Abdelmouhaimen</p>
              <p className="text-[10px] text-[var(--muted)]">Pro member</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, label }: { n: string; label: string }) {
  return (
    <div className="card px-2 py-3">
      <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] text-[var(--accent-2)]">
        {n}
      </div>
      {label}
    </div>
  );
}

function PlanFeature({ label, active, upcoming }: { label: string; active?: boolean; upcoming?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {active && <span className="text-[var(--good)]">✓</span>}
      {upcoming && <span className="text-amber-400">+</span>}
      <span className={active ? "text-[var(--fg)]" : "text-[var(--muted)]"}>{label}</span>
    </li>
  );
}

