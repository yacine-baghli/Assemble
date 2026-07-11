"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

// The page a matched candidate lands on after clicking their Assemble invite
// link (e.g. https://try.teamassemble.fr/join?...). Their profile is
// auto-completed from the link params, as if Assemble already knew them.
export default function JoinPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[var(--muted)]">Loading your invite…</div>}>
      <JoinInner />
    </Suspense>
  );
}

function JoinInner() {
  const sp = useSearchParams();
  const name = sp.get("name") ?? "there";
  const firstName = name.split(" ")[0];
  const headline = sp.get("headline") ?? "";
  const role = sp.get("role") ?? "co-founder";
  const why = sp.get("why") ?? "";
  const project = sp.get("project") ?? "a new startup";
  const inviter = sp.get("by") ?? "A founder";
  const location = sp.get("loc") ?? "";
  const profileUrl = sp.get("purl") ?? "";
  const expertise = useMemo(
    () => (sp.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    [sp],
  );

  // Profile form, PRE-FILLED from the invite (auto-completed).
  const [form, setForm] = useState({
    name,
    headline,
    skills: expertise.join(", "),
    location,
    email: "",
  });
  const [accepted, setAccepted] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-12">
      <header className="mb-8 flex items-center justify-center gap-2">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
        <span className="text-sm font-semibold tracking-tight">Assemble</span>
      </header>

      {accepted ? (
        <div className="card fade-up p-8 text-center">
          <div className="text-4xl">🤝</div>
          <h1 className="mt-3 text-2xl font-bold">You&apos;re in, {firstName}.</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {inviter} has been notified. They&apos;ll reach out to set up a first
            call about <span className="text-[var(--fg)]">{project}</span>.
          </p>
        </div>
      ) : (
        <div className="fade-up space-y-6">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--good)]" />
              You&apos;ve been matched
            </div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {firstName}, {inviter} wants to build{" "}
              <span className="gradient-text">with you</span>.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)]">
              Assemble matched you as the <strong>{role}</strong> for{" "}
              <span className="text-[var(--fg)]">{project}</span>.
            </p>
          </div>

          {why && (
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--accent-2)]">
                Why you
              </p>
              <p className="mt-1 text-sm leading-relaxed">{why}</p>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                Your profile
              </p>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--good)]">
                ✓ auto-filled from your public profile
              </span>
            </div>

            <div className="mt-3 grid gap-3">
              <Field label="Name" value={form.name} onChange={set("name")} />
              <Field label="Current role" value={form.headline} onChange={set("headline")} />
              <Field label="Key skills" value={form.skills} onChange={set("skills")} />
              <Field label="Location" value={form.location} onChange={set("location")} />
              <Field
                label="Email (add yours to continue)"
                value={form.email}
                onChange={set("email")}
                placeholder="you@email.com"
                type="email"
              />
            </div>

            {profileUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-[var(--accent-2)] hover:underline"
              >
                linked profile ↗
              </a>
            )}
          </div>

          <button
            onClick={() => setAccepted(true)}
            disabled={!form.email}
            className="btn-accent w-full rounded-xl px-5 py-3 text-sm font-semibold"
          >
            Accept &amp; meet {inviter.split(" ")[0]} →
          </button>
          <p className="text-center text-[11px] text-[var(--muted)]">
            Powered by Assemble · try.teamassemble.fr
          </p>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-[var(--muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
