import Teaser from "@/components/Teaser";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-14 sm:py-20">
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
