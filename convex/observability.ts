import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// ── Internal write helpers (called from actions) ─────────────────────
export const startRun = internalMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agent_runs", {
      projectId: args.projectId,
      label: args.label,
      status: "running",
      startedAt: Date.now(),
      totalTokens: 0,
      totalCostUsd: 0,
    });
  },
});

export const logStep = internalMutation({
  args: {
    runId: v.id("agent_runs"),
    parentStepId: v.optional(v.id("agent_steps")),
    agent: v.string(),
    input: v.string(),
    output: v.string(),
    tokens: v.number(),
    costUsd: v.number(),
    latencyMs: v.number(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stepId = await ctx.db.insert("agent_steps", {
      runId: args.runId,
      parentStepId: args.parentStepId,
      agent: args.agent,
      input: args.input.slice(0, 4000),
      output: args.output.slice(0, 8000),
      tokens: args.tokens,
      costUsd: args.costUsd,
      latencyMs: args.latencyMs,
      status: args.status ?? "ok",
      createdAt: Date.now(),
    });
    const run = await ctx.db.get(args.runId);
    if (run) {
      await ctx.db.patch(args.runId, {
        totalTokens: run.totalTokens + args.tokens,
        totalCostUsd: run.totalCostUsd + args.costUsd,
      });
    }
    return stepId;
  },
});

export const endRun = internalMutation({
  args: {
    runId: v.id("agent_runs"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      endedAt: Date.now(),
    });
  },
});

// ── Public read API for the /runs dashboard ──────────────────────────
export const listRuns = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query("agent_runs").order("desc").take(50);
    return runs;
  },
});

export const getRun = query({
  args: { runId: v.id("agent_runs") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;
    const steps = await ctx.db
      .query("agent_steps")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .order("asc")
      .collect();
    return { run, steps };
  },
});
