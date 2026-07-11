"use client";

import { useEffect, useState } from "react";
import Teaser from "@/components/Teaser";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "U";
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Read user name from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    const stored = localStorage.getItem("assemble_user_name");
    if (nameFromUrl) {
      setUserName(nameFromUrl);
      localStorage.setItem("assemble_user_name", nameFromUrl);
    } else if (stored) {
      setUserName(stored);
    }
  }, []);

  const initials = getInitials(userName);

  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-5 py-14 sm:py-20">
        <header className="mb-10 flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="var(--fg)"/></svg>
            <span className="text-sm font-semibold tracking-tight">Assemble</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Help button */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--fg)] hover:border-[var(--fg)]"
              aria-label="How it works"
            >
              ?
            </button>
            {/* User badge */}
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--good)] opacity-75" />
                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--good)]" />
              </span>
              <span className="text-xs text-[var(--muted)]">Connected as</span>
              <div className="h-5 w-5 rounded-full bg-[var(--fg)] flex items-center justify-center text-[8px] font-bold text-[var(--bg)]">
                {initials}
              </div>
              <span className="text-xs font-semibold">{userName}</span>
            </div>
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

      {/* Sidebar — Plan status (overlay) */}
      {sidebarOpen && (
        <aside className="fixed right-4 top-16 z-40 w-[280px] rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-6 shadow-lg">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] transition-colors hover:text-[var(--fg)] hover:border-[var(--fg)]"
            aria-label="Close sidebar"
          >
            ✕
          </button>

          <div className="mb-5">
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

          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Your plan includes</p>
            <ul className="space-y-1.5">
              <PlanFeature active label="1 idea at a time" />
              <PlanFeature active label="3 profile matches" />
              <PlanFeature active label="Outreach to 1 profile" />
              <PlanFeature active label="Voice agent demo" />
            </ul>
          </div>

          <div className="h-px bg-[var(--border)] my-3" />

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
                    console.error("Dodo checkout error:", data);
                    alert(data.error || "Could not create checkout session.");
                  }
                } catch (err) {
                  console.error("Checkout error:", err);
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
        </aside>
      )}

      {/* Help / How it works modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setHelpOpen(false)}>
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setHelpOpen(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--serif)' }}>How Assemble works</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Built at the Hermes Buildathon — here&apos;s the full picture.</p>

            <div className="space-y-5">
              <HelpSection
                step="01"
                title="You describe your idea"
                description="Type or speak your startup idea using our voice interface. Our AI decomposes it into the expertise domains you'll need to build it."
              />
              <HelpSection
                step="02"
                title="We find the right people"
                description="Assemble searches professional networks using Linkup's deep web search to find candidates whose experience matches the expertise gaps in your project."
              />
              <HelpSection
                step="03"
                title="We verify the fit"
                description="Each candidate is scored on how well their background matches your specific needs. We use OpenAI's models to analyze profile-to-project relevance."
              />
              <HelpSection
                step="04"
                title="Personalized outreach"
                description="Select a candidate and we draft a personalized outreach. The candidate receives a voice introduction powered by ElevenLabs where they can learn about your project interactively."
              />
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Powered by</p>
              <div className="grid grid-cols-2 gap-3">
                <PartnerBadge name="OpenAI" role="Idea decomposition & matching" />
                <PartnerBadge name="Linkup" role="Deep web profile sourcing" />
                <PartnerBadge name="ElevenLabs" role="Voice agent & speech-to-text" />
                <PartnerBadge name="Convex" role="Real-time backend" />
                <PartnerBadge name="Cloudflare Workers" role="Edge deployment" />
                <PartnerBadge name="Dodo Payments" role="Subscription billing" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
              <p className="text-xs text-[var(--muted)]">
                Built by Abdelmouhaimen & Yacine · Hermes Buildathon 2025
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpSection({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-[10px] font-bold text-[var(--muted)] tracking-wider mt-1">{step}</span>
      <div>
        <p className="text-sm font-semibold mb-1">{title}</p>
        <p className="text-sm text-[var(--muted)] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PartnerBadge({ name, role }: { name: string; role: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
      <p className="text-xs font-semibold">{name}</p>
      <p className="text-[10px] text-[var(--muted)] leading-tight">{role}</p>
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
