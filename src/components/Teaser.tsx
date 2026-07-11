"use client";

import { useState } from "react";
import {
  captureEmail,
  convexEnabled,
  teaserPreview,
  type TeaserResult,
} from "@/lib/backend";

const EXAMPLES = [
  "A device that grows human neurons on microfluidic chips to test drugs without animals",
  "An AI copilot that turns messy field-sales voice notes into updated CRM records",
  "A marketplace connecting indie game studios with freelance sound designers",
];

type Stage = "idea" | "loading" | "preview" | "captured";

export default function Teaser() {
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<Stage>("idea");
  const [result, setResult] = useState<TeaserResult | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onAssemble() {
    if (idea.trim().length < 8) {
      setError("Give me a sentence or two about your idea.");
      return;
    }
    setError(null);
    setStage("loading");
    try {
      const r = await teaserPreview(idea);
      setResult(r);
      setStage("preview");
    } catch (e) {
      setError((e as Error).message || "Something went wrong.");
      setStage("idea");
    }
  }

  async function onCapture(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await captureEmail({
        email,
        projectId: result?.projectId,
        source: "teaser",
      });
      setStage("captured");
    } catch (err) {
      setError((err as Error).message || "Could not save your email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Idea input */}
      {(stage === "idea" || stage === "loading") && (
        <div className="fade-up">
          <div className="card p-2">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your idea in a sentence or two…"
              rows={3}
              disabled={stage === "loading"}
              className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-[var(--muted)]"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onAssemble();
              }}
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs text-[var(--muted)]">
                {stage === "loading" ? "Decomposing your idea…" : "⌘/Ctrl + Enter"}
              </span>
              <button
                onClick={onAssemble}
                disabled={stage === "loading"}
                className="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                {stage === "loading" ? "Assembling…" : "Assemble my team →"}
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          {stage === "idea" && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                Try an example
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setIdea(ex)}
                    className="chip px-3 py-2 text-left text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "loading" && <LoadingSkeleton />}
        </div>
      )}

      {/* Preview + email gate */}
      {(stage === "preview" || stage === "captured") && result && (
        <div className="fade-up space-y-6">
          <Preview result={result} />

          {stage === "preview" ? (
            <div className="card p-6 text-center">
              <h3 className="text-lg font-semibold">
                Your founding team is ready.
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Drop your email to unlock the real people behind these roles —
                sourced from the public web, each match explained.
              </p>
              <form
                onSubmit={onCapture}
                className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@work.com"
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  {submitting ? "Saving…" : "Unlock my team"}
                </button>
              </form>
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
              <p className="mt-3 text-xs text-[var(--muted)]">
                No spam. We&apos;ll email you when your matches are live.
              </p>
            </div>
          ) : (
            <div className="card p-6 text-center fade-up">
              <div className="text-3xl">✅</div>
              <h3 className="mt-2 text-lg font-semibold">You&apos;re on the list.</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                We&apos;ll reach out at <span className="text-[var(--fg)]">{email}</span>{" "}
                with your matched co-founders.
              </p>
              <button
                onClick={() => {
                  setIdea("");
                  setEmail("");
                  setResult(null);
                  setStage("idea");
                }}
                className="mt-4 text-sm text-[var(--accent-2)] hover:underline"
              >
                Try another idea
              </button>
            </div>
          )}
        </div>
      )}

      {!convexEnabled && (
        <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
          demo mode — running the deterministic decomposition locally. Connect
          Convex + OpenAI keys for live sourcing.
        </p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card shimmer h-20" />
      ))}
    </div>
  );
}

function Preview({ result }: { result: TeaserResult }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Domains detected
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {result.domains.map((d) => (
            <span key={d} className="chip px-3 py-1 text-sm">
              {d}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Expertise you&apos;re missing
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {result.missingExpertise.map((d) => (
            <span
              key={d}
              className="chip px-3 py-1 text-sm text-[var(--accent-2)]"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {result.clarifyingQuestions.length > 0 && (
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
            The agent wants to know
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {result.clarifyingQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Your founding team ({result.previewCandidates.length} matches)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {result.previewCandidates.map((c, i) => (
            <div key={i} className="card relative overflow-hidden p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
                <div className="blur-locked text-sm font-semibold">{c.name}</div>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{c.headline}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--fg)]/80">
                {c.whyMatch}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.expertise.map((e) => (
                  <span key={e} className="chip px-2 py-0.5 text-[10px]">
                    {e}
                  </span>
                ))}
              </div>
              <div className="absolute right-2 top-2 text-[10px] text-[var(--muted)]">
                🔒 locked
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
