import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  buildStrategyUserPrompt,
  coerceStrategyResult,
  demoStrategy,
  STRATEGY_SYSTEM_PROMPT,
  type StrategyResult,
} from "./lib/strategy";
import { chatJson, hasOpenAI } from "./lib/openai";

// Persist the light teaser decomposition as a project row.
export const persistTeaserProject = internalMutation({
  args: {
    ideaText: v.string(),
    domains: v.array(v.string()),
    challenges: v.array(v.string()),
    missingExpertise: v.array(v.string()),
    risks: v.array(v.string()),
    clarifyingQuestions: v.array(v.string()),
    demoMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      ideaText: args.ideaText,
      domains: args.domains,
      challenges: args.challenges,
      missingExpertise: args.missingExpertise,
      risks: args.risks,
      clarifyingQuestions: args.clarifyingQuestions,
      status: "draft",
      demoMode: args.demoMode,
      createdAt: Date.now(),
    });
  },
});

// Public teaser entry point: idea → light decomposition + blurred preview.
export const runTeaserPreview = action({
  args: { idea: v.string() },
  handler: async (ctx, args) => {
    const idea = args.idea.trim().slice(0, 2000);
    if (idea.length < 3) throw new Error("Idea is too short");

    const runId = await ctx.runMutation(internal.observability.startRun, {
      label: "teaser:strategy-light",
    });

    const demoMode = !hasOpenAI();
    let result: StrategyResult;
    let tokens = 0;
    let costUsd = 0;
    let latencyMs = 0;
    let output = "";
    let status = "ok";

    try {
      if (demoMode) {
        const t0 = Date.now();
        result = demoStrategy(idea);
        latencyMs = Date.now() - t0;
        output = JSON.stringify(result).slice(0, 4000);
      } else {
        const call = await chatJson({
          system: STRATEGY_SYSTEM_PROMPT,
          user: buildStrategyUserPrompt(idea),
        });
        result = coerceStrategyResult(call.json, idea);
        tokens = call.tokens;
        costUsd = call.costUsd;
        latencyMs = call.latencyMs;
        output = call.content.slice(0, 4000);
      }
    } catch (e) {
      // Never fail the funnel: degrade to the deterministic path.
      status = "error";
      result = demoStrategy(idea);
      output = `error: ${(e as Error).message}`;
    }

    await ctx.runMutation(internal.observability.logStep, {
      runId,
      agent: "StrategyAgent(light)",
      input: idea,
      output,
      tokens,
      costUsd,
      latencyMs,
      status,
    });

    const projectId = await ctx.runMutation(internal.strategy.persistTeaserProject, {
      ideaText: idea,
      domains: result.domains,
      challenges: result.challenges,
      missingExpertise: result.missingExpertise,
      risks: result.risks,
      clarifyingQuestions: result.clarifyingQuestions,
      demoMode,
    });

    await ctx.runMutation(internal.observability.endRun, {
      runId,
      status: status === "error" ? "error" : "done",
    });

    return {
      projectId,
      demoMode,
      domains: result.domains,
      missingExpertise: result.missingExpertise,
      challenges: result.challenges,
      clarifyingQuestions: result.clarifyingQuestions,
      previewCandidates: result.previewCandidates,
    };
  },
});
