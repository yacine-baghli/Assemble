"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { getRun, type AgentRun, type AgentStep } from "@/lib/backend";

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const [data, setData] = useState<{ run: AgentRun; steps: AgentStep[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await getRun(runId);
        if (alive) setData(r);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [runId]);

  const agents = useMemo(() => {
    const set = new Set<string>();
    data?.steps.forEach((s) => set.add(s.agent.split(":")[0]));
    return Array.from(set);
  }, [data]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/runs" className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
          ← all runs
        </Link>
      </header>

      {loading && !data && <div className="card shimmer h-24" />}
      {!loading && !data && (
        <p className="text-sm text-[var(--muted)]">Run not found.</p>
      )}

      {data && (
        <>
          <div className="card mb-5 p-5">
            <h1 className="font-mono text-lg font-semibold">{data.run.label}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
              <span>status: {data.run.status}</span>
              <span>{data.run.totalTokens.toLocaleString()} tokens</span>
              <span>${data.run.totalCostUsd.toFixed(4)}</span>
              <span>
                {data.run.endedAt
                  ? `${data.run.endedAt - data.run.startedAt} ms total`
                  : "running…"}
              </span>
              <span>{data.steps.length} steps</span>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            <FilterChip label="all" active={filter === "all"} onClick={() => setFilter("all")} />
            {agents.map((a) => (
              <FilterChip
                key={a}
                label={a}
                active={filter === a}
                onClick={() => setFilter(a)}
              />
            ))}
          </div>

          <StepTree steps={data.steps} filter={filter} />
        </>
      )}
    </main>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs ${
        active
          ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white"
          : "chip text-[var(--muted)]"
      }`}
    >
      {label}
    </button>
  );
}

function StepTree({ steps, filter }: { steps: AgentStep[]; filter: string }) {
  // Group into roots + children by parentStepId to render the call tree.
  const children = new Map<string, AgentStep[]>();
  const roots: AgentStep[] = [];
  for (const s of steps) {
    if (s.parentStepId) {
      const arr = children.get(s.parentStepId) ?? [];
      arr.push(s);
      children.set(s.parentStepId, arr);
    } else {
      roots.push(s);
    }
  }
  const match = (s: AgentStep) => filter === "all" || s.agent.startsWith(filter);

  return (
    <div className="space-y-2">
      {roots.map((r) => (
        <div key={r._id}>
          {match(r) && <StepRow step={r} />}
          <div className="ml-4 mt-2 space-y-2 border-l border-[var(--border)] pl-4">
            {(children.get(r._id) ?? []).filter(match).map((c) => (
              <StepRow key={c._id} step={c} child />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepRow({ step, child }: { step: AgentStep; child?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              step.status === "error" ? "bg-red-500" : "bg-[var(--good)]"
            }`}
          />
          <span className="font-mono text-sm">
            {child ? "↳ " : ""}
            {step.agent}
          </span>
        </div>
        <div className="flex gap-3 text-[11px] text-[var(--muted)]">
          <span>{step.tokens} tok</span>
          <span>${step.costUsd.toFixed(4)}</span>
          <span>{step.latencyMs} ms</span>
          <span>{open ? "▾" : "▸"}</span>
        </div>
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-xs">
          <div>
            <p className="mb-1 uppercase tracking-wider text-[var(--muted)]">input</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--bg-2)] p-2 text-[var(--fg)]/80">
              {step.input}
            </pre>
          </div>
          <div>
            <p className="mb-1 uppercase tracking-wider text-[var(--muted)]">output</p>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--bg-2)] p-2 text-[var(--fg)]/80">
              {step.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
