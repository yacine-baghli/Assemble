"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  convexEnabled,
  createCheckout,
  getCapabilities,
  loadProjectResult,
  runPipeline,
  unlockProject,
  type Candidate,
  type Capabilities,
  type PipelineResult,
} from "@/lib/backend";
import VoiceMic from "@/components/VoiceMic";
import OutreachPanel from "@/components/OutreachPanel";
import { speak, stopSpeaking, supportsBrowserTTS } from "@/lib/voice";

const PHASES = ["Strategy", "Scouting", "Ranking"];

const NO_CAPS: Capabilities = {
  openai: false,
  linkup: false,
  elevenlabsStt: false,
  elevenlabsTts: false,
  resend: false,
  dodo: false,
};

export default function AppPage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caps, setCaps] = useState<Capabilities>(NO_CAPS);
  const [prefs, setPrefs] = useState("");

  useEffect(() => {
    getCapabilities().then(setCaps).catch(() => {});
    // Memory: load remembered founder preferences.
    try {
      setPrefs(localStorage.getItem("assemble:prefs") ?? "");
    } catch {}
  }, []);

  function savePrefs(v: string) {
    setPrefs(v);
    try {
      localStorage.setItem("assemble:prefs", v);
    } catch {}
  }

  const notes = () =>
    prefs
      .split(/[\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  // Handle return from a Dodo checkout: ?unlocked=<projectId>.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("unlocked");
    if (!pid) return;
    (async () => {
      await unlockProject(pid, false).catch(() => {});
      const fresh = await loadProjectResult(pid).catch(() => null);
      if (fresh) setResult(fresh);
      window.history.replaceState({}, "", "/app");
    })();
  }, []);

  async function run() {
    if (idea.trim().length < 8) {
      setError("Describe your idea in a sentence or two.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setPhase(0);
    // Cosmetic phase ticker while the real pipeline runs server-side.
    const ticker = setInterval(
      () => setPhase((p) => Math.min(p + 1, PHASES.length - 1)),
      1400,
    );
    try {
      // Freemium: best-fit starts locked; user unlocks the #1 via Dodo.
      const r = await runPipeline(idea, false, notes());
      setResult(r);
    } catch (e) {
      setError((e as Error).message || "Pipeline failed.");
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
          <span className="text-sm font-semibold tracking-tight">Assemble</span>
        </Link>
        <Link
          href="/runs"
          className="chip px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--fg)]"
        >
          agent traces →
        </Link>
      </header>

      <h1 className="text-2xl font-bold tracking-tight">
        Build your founding team
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Describe the idea. The agents decompose it, source real people, and
        explain every match.
      </p>

      <div className="card mt-5 p-2">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          placeholder="e.g. A device that grows human neurons on microfluidic chips to test drugs without animals"
          className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-[var(--muted)]"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
          }}
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-3">
            <VoiceMic caps={caps} onText={(t) => setIdea(t)} onPartial={(t) => setIdea(t)} />
            <span className="text-xs text-[var(--muted)]">⌘/Ctrl + Enter</span>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            {loading ? "Assembling…" : "Assemble team →"}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--fg)]">
          ⚙ preferences the agents remember
        </summary>
        <input
          value={prefs}
          onChange={(e) => savePrefs(e.target.value)}
          placeholder="e.g. prefer technical co-founders in Europe; avoid agencies"
          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Saved on this device and fed into every run — the assistant gets
          smarter about what you want.
        </p>
      </details>

      {loading && <PhaseTracker phase={phase} />}

      {result && (
        <Results
          result={result}
          caps={caps}
          ideaText={idea}
          onUpdate={setResult}
        />
      )}
    </main>
  );
}

function PhaseTracker({ phase }: { phase: number }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        {PHASES.map((p, i) => (
          <div key={p} className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                i <= phase
                  ? "border-[var(--accent)] text-[var(--fg)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  i < phase
                    ? "bg-[var(--good)]"
                    : i === phase
                      ? "bg-[var(--accent-2)] animate-pulse"
                      : "bg-[var(--border)]"
                }`}
              />
              {p}
            </div>
            {i < PHASES.length - 1 && (
              <div className="h-px w-6 bg-[var(--border)]" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card shimmer h-40" />
        ))}
      </div>
    </div>
  );
}

function buildSpokenSummary(result: PipelineResult): string {
  const roles = result.personas.map((p) => p.role);
  const best = result.candidates.find((c) => c.isBestFit && !c.locked);
  const parts: string[] = [];
  parts.push(
    `Here's what I found. Your idea spans ${result.domains.slice(0, 2).join(" and ")}.`,
  );
  parts.push(
    `You're missing ${roles.length} key ${roles.length === 1 ? "role" : "roles"}: ${roles.join(", ")}.`,
  );
  if (best) parts.push(`Your strongest match is ${best.name}. ${best.whyMatch}`);
  if (result.clarifyingQuestions.length > 0) {
    parts.push(`One question before we go deeper: ${result.clarifyingQuestions[0]}`);
  }
  return parts.join(" ");
}

function Results({
  result,
  caps,
  ideaText,
  onUpdate,
}: {
  result: PipelineResult;
  caps: Capabilities;
  ideaText: string;
  onUpdate: (r: PipelineResult) => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [outreachFor, setOutreachFor] = useState<Candidate | null>(null);
  const lockedBestFit = result.candidates.find((c) => c.isBestFit && c.locked);
  const byPersona = new Map<string, Candidate[]>();
  for (const c of result.candidates) {
    const arr = byPersona.get(c.personaRole) ?? [];
    arr.push(c);
    byPersona.set(c.personaRole, arr);
  }
  const canSpeak = caps.elevenlabsTts || supportsBrowserTTS();

  async function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await speak(buildSpokenSummary(result), caps);
    // Best-effort reset; browser TTS has no reliable single-shot end here.
    setTimeout(() => setSpeaking(false), 1500);
  }

  const [unlocking, setUnlocking] = useState(false);
  async function unlock() {
    setUnlocking(true);
    try {
      const demo = result.demoMode || result.projectId.startsWith("demo-");
      // Live path: real Dodo checkout redirect.
      if (!demo && caps.dodo) {
        const returnUrl = `${window.location.origin}/app?unlocked=${result.projectId}`;
        const { url } = await createCheckout(result.projectId, returnUrl);
        if (url) {
          window.location.href = url;
          return;
        }
      }
      // Demo / no-Dodo path: simulated unlock (clearly labeled in the UI).
      if (!demo) {
        await unlockProject(result.projectId, true).catch(() => {});
        const fresh = await loadProjectResult(result.projectId).catch(() => null);
        if (fresh) {
          onUpdate(fresh);
          return;
        }
      }
      // Pure demo mode: deterministic re-run reveals the same best-fit.
      const revealed = await runPipeline(ideaText, true);
      onUpdate(revealed);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="fade-up mt-8 space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="chip px-3 py-1">
          {result.usedLinkup ? "🔗 Linkup live" : "demo sourcing"}
        </span>
        {canSpeak && (
          <button
            onClick={toggleSpeak}
            className="chip px-3 py-1 hover:text-[var(--fg)]"
          >
            {speaking ? "⏹ stop" : `🔊 hear the summary${caps.elevenlabsTts ? " (ElevenLabs)" : ""}`}
          </button>
        )}
        {result.demoMode && (
          <span className="chip px-3 py-1 text-[var(--muted)]">
            demo mode — add OpenAI + Linkup keys for live agents
          </span>
        )}
        {result.runId && (
          <Link href={`/runs/${result.runId}`} className="chip px-3 py-1 text-[var(--accent-2)]">
            view this run&apos;s trace →
          </Link>
        )}
      </div>

      {lockedBestFit && (
        <div className="card flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold">🔓 Your #1 best-fit co-founder is locked</p>
            <p className="text-sm text-[var(--muted)]">
              The single strongest match ({Math.round(lockedBestFit.confidence * 100)}% ·{" "}
              {lockedBestFit.personaRole}) — unlock to see who it is and reach out.
            </p>
          </div>
          <button
            onClick={unlock}
            disabled={unlocking}
            className="btn-accent shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            {unlocking
              ? "Unlocking…"
              : caps.dodo && !result.demoMode
                ? "Unlock — pay with Dodo"
                : "Unlock (simulated)"}
          </button>
        </div>
      )}

      <Decomposition result={result} />

      {result.personas.map((persona) => {
        const cands = byPersona.get(persona.role) ?? [];
        return (
          <section key={persona.role}>
            <div className="mb-3">
              <h3 className="text-lg font-semibold">{persona.role}</h3>
              <p className="text-sm text-[var(--muted)]">{persona.rationale}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {persona.requiredSkills.map((s) => (
                  <span key={s} className="chip px-2 py-0.5 text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {cands.map((c, i) => (
                <CandidateCard key={i} c={c} onOutreach={() => setOutreachFor(c)} />
              ))}
              {cands.length === 0 && (
                <p className="text-sm text-[var(--muted)]">No candidates yet.</p>
              )}
            </div>
          </section>
        );
      })}

      {outreachFor && (
        <OutreachPanel
          candidate={outreachFor}
          ideaText={ideaText}
          domains={result.domains}
          caps={caps}
          onClose={() => setOutreachFor(null)}
        />
      )}
    </div>
  );
}

function Decomposition({ result }: { result: PipelineResult }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Block title="Domains" items={result.domains} accent />
      <Block title="Missing expertise" items={result.missingExpertise} />
      <Block title="Key challenges" items={result.challenges} list />
      <Block title="Top risks" items={result.risks} list />
      {result.clarifyingQuestions.length > 0 && (
        <div className="card p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-wider text-[var(--accent-2)]">
            The agent wants to clarify
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {result.clarifyingQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  items,
  accent,
  list,
}: {
  title: string;
  items: string[];
  accent?: boolean;
  list?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{title}</p>
      {list ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((i) => (
            <span
              key={i}
              className={`chip px-2.5 py-1 text-sm ${accent ? "" : "text-[var(--accent-2)]"}`}
            >
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateCard({ c, onOutreach }: { c: Candidate; onOutreach: () => void }) {
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);
  const pct = Math.round(c.confidence * 100);
  return (
    <div
      className={`card relative p-4 transition-opacity ${
        decision === "rejected" ? "opacity-40" : ""
      }`}
    >
      {c.isBestFit && (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-2 py-0.5 text-[10px] font-semibold text-white">
          ★ best fit
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{c.name}</div>
          <div className="truncate text-xs text-[var(--muted)]">
            {c.headline}
            {c.location ? ` · ${c.location}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span>match confidence</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{c.whyMatch}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {c.expertise.map((e) => (
          <span key={e} className="chip px-2 py-0.5 text-[10px]">
            {e}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          {c.profileUrls.slice(0, 2).map((u, i) => (
            <a
              key={i}
              href={u}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--accent-2)] hover:underline"
            >
              profile ↗
            </a>
          ))}
          {c.locked && <span className="text-xs text-[var(--muted)]">🔒 gated</span>}
          {!c.locked && (
            <button
              onClick={onOutreach}
              className="text-xs text-[var(--accent-2)] hover:underline"
            >
              ✉ draft outreach
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setDecision("rejected")}
            className="chip px-2.5 py-1 text-xs hover:text-red-400"
          >
            pass
          </button>
          <button
            onClick={() => setDecision(decision === "accepted" ? null : "accepted")}
            className={`rounded-full px-2.5 py-1 text-xs ${
              decision === "accepted"
                ? "bg-[var(--good)] text-black"
                : "chip hover:text-[var(--good)]"
            }`}
          >
            {decision === "accepted" ? "✓ shortlisted" : "shortlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
