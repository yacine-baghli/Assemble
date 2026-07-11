"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { convexEnabled, listRuns, type AgentRun } from "@/lib/backend";

export default function RunsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await listRuns();
        if (alive) setRuns(r);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 4000); // light polling for a live feel
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
          <span className="text-sm font-semibold tracking-tight">Assemble</span>
        </Link>
        <Link href="/app" className="chip px-3 py-1.5 text-xs text-[var(--muted)]">
          ← back to app
        </Link>
      </header>

      <h1 className="text-2xl font-bold tracking-tight">Agent runs</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Every agent step logged — tokens, cost, and latency, in a call tree.
      </p>

      {!convexEnabled && (
        <div className="card mt-6 p-6 text-sm text-[var(--muted)]">
          Observability is backed by Convex. Run{" "}
          <code className="text-[var(--accent-2)]">npx convex dev</code> and
          launch a pipeline from{" "}
          <Link href="/app" className="text-[var(--accent-2)] underline">
            /app
          </Link>{" "}
          to see runs here.
        </div>
      )}

      {convexEnabled && (
        <div className="mt-6 space-y-2">
          {loading && runs.length === 0 && (
            <div className="card shimmer h-16" />
          )}
          {!loading && runs.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No runs yet — start one from /app.
            </p>
          )}
          {runs.map((r) => (
            <Link
              key={r._id}
              href={`/runs/${r._id}`}
              className="card flex items-center justify-between p-4 transition-colors hover:border-[var(--accent)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <StatusDot status={r.status} />
                  <span className="font-mono text-sm">{r.label}</span>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(r.startedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <div>{r.totalTokens.toLocaleString()} tokens</div>
                <div>${r.totalCostUsd.toFixed(4)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "done"
      ? "bg-[var(--good)]"
      : status === "error"
        ? "bg-red-500"
        : "bg-[var(--accent-2)] animate-pulse";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}
