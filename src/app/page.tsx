"use client";

import { useCallback, useState } from "react";
import Teaser from "@/components/Teaser";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-5 py-14 sm:py-20">
        <header className="mb-10 flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assemble-mark.png" alt="" className="h-6 w-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-sm font-semibold tracking-tight">Assemble</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--good)] opacity-75" />
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--good)]" />
            </span>
            <span className="text-xs text-[var(--muted)]">Connected as</span>
            <div className="h-5 w-5 rounded-full bg-[var(--fg)] flex items-center justify-center text-[8px] font-bold text-[var(--bg)]">
              AB
            </div>
            <span className="text-xs font-semibold">Abdelmouhaimen</span>
          </div>
        </header>

        <section className="mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--good)]" />
            AI that builds your founding team
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl" style={{ fontFamily: 'var(--serif)' }}>
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

      {/* Floating open button (when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium shadow-md transition-all hover:shadow-lg"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--good)] opacity-75" />
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--good)]" />
          </span>
          <span className="inline-flex items-center rounded bg-[var(--fg)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--bg)]">
            Pro
          </span>
        </button>
      )}

      {/* Sidebar — Plan status */}
      {sidebarOpen && (
        <aside className="hidden lg:flex w-[280px] flex-col border-l border-[var(--border)] bg-[var(--card)] px-5 py-8 relative">
          {/* Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] transition-colors hover:text-[var(--fg)] hover:border-[var(--fg)]"
            aria-label="Close sidebar"
          >
            ✕
          </button>

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
              <span className="inline-flex items-center rounded-md bg-[var(--fg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--bg)]">
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
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-md bg-[var(--fg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--bg)]">
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
              <button
                onClick={async () => {
                  setUpgradeLoading(true);
                  try {
                    const res = await fetch("/api/dodo-checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ returnUrl: window.location.href }),
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.open(data.url, "_blank");
                    } else {
                      alert("Dodo checkout is not configured yet. This is a demo feature.");
                    }
                  } catch {
                    alert("Could not create checkout session. Please try again.");
                  } finally {
                    setUpgradeLoading(false);
                  }
                }}
                disabled={upgradeLoading}
                className="block w-full rounded-lg bg-[var(--fg)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--bg)] border-none cursor-pointer transition-all hover:opacity-90 hover:translate-y-[-1px] disabled:opacity-60"
              >
                {upgradeLoading ? "Creating checkout…" : "Upgrade to Business →"}
              </button>
              <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
                Powered by Dodo Payments
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="mt-auto pt-6 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[var(--fg)] flex items-center justify-center text-[10px] font-bold text-[var(--bg)]">
                AB
              </div>
              <div>
                <p className="text-xs font-semibold">Abdelmouhaimen</p>
                <p className="text-[10px] text-[var(--muted)]">Pro member</p>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function Step({ n, label }: { n: string; label: string }) {
  return (
    <div className="card px-2 py-3">
      <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] text-xs font-semibold">
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
      {upcoming && <span className="text-[var(--muted)]">+</span>}
      <span className={active ? "text-[var(--fg)]" : "text-[var(--muted)]"}>{label}</span>
    </li>
  );
}
