"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { LinkupClient } from "linkup-sdk";
import {
  buildStrategyUserPrompt,
  coerceStrategyResult,
  demoStrategy,
  STRATEGY_SYSTEM_PROMPT,
  type Persona,
  type StrategyResult,
} from "./lib/strategy";
import { chatJson, hasOpenAI } from "./lib/openai";
import {
  buildLinkupQuery,
  buildRankingUserPrompt,
  coerceRanked,
  demoCandidatesForPersona,
  demoRank,
  LINKUP_PEOPLE_SCHEMA,
  RANKING_SYSTEM_PROMPT,
  type RankedCandidate,
  type RawCandidate,
} from "./lib/scout";

const PEOPLE_DOMAINS = ["linkedin.com", "scholar.google.com", "github.com"];

function hasLinkup(): boolean {
  return !!process.env.LINKUP_API_KEY;
}

async function linkupSearch(persona: Persona, domains: string[]): Promise<RawCandidate[]> {
  const client = new LinkupClient({ apiKey: process.env.LINKUP_API_KEY as string });
  const res = (await client.search({
    query: buildLinkupQuery(persona, domains),
    depth: "standard",
    outputType: "structured",
    structuredOutputSchema: LINKUP_PEOPLE_SCHEMA,
    includeDomains: PEOPLE_DOMAINS,
  })) as { candidates?: RawCandidate[] };
  const list = Array.isArray(res?.candidates) ? res.candidates : [];
  return list
    .filter((c) => c && c.name && c.profileUrl)
    .slice(0, 5)
    .map((c) => ({
      name: String(c.name),
      headline: String(c.headline ?? ""),
      location: c.location ? String(c.location) : undefined,
      expertise: Array.isArray(c.expertise) ? c.expertise.map(String) : [],
      profileUrl: String(c.profileUrl),
      evidence: c.evidence ? String(c.evidence) : undefined,
    }));
}

type PublicCandidate = {
  name: string;
  headline: string;
  location?: string;
  whyMatch: string;
  expertise: string[];
  profileUrls: string[];
  confidence: number;
  isBestFit: boolean;
  personaRole: string;
  locked: boolean;
};

type PipelineActionResult = {
  projectId: Id<"projects">;
  demoMode: boolean;
  runId: Id<"agent_runs">;
  usedLinkup: boolean;
  domains: string[];
  missingExpertise: string[];
  challenges: string[];
  risks: string[];
  clarifyingQuestions: string[];
  personas: Persona[];
  candidates: PublicCandidate[];
};

// Full agency pipeline: idea → strategy → parallel scouts → ranking → persist.
// Returns the assembled bundle so the frontend needs no follow-up query.
// Explicit return type breaks Convex's circular api/internal type inference.
export const runFullPipeline = action({
  args: {
    idea: v.string(),
    revealBestFit: v.optional(v.boolean()),
    notes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<PipelineActionResult> => {
    const idea = args.idea.trim().slice(0, 2000);
    if (idea.length < 8) throw new Error("Idea is too short");

    // Memory: founder preferences from earlier sessions bias the agents.
    const notes = (args.notes ?? []).filter((n) => n && n.trim()).slice(0, 8);
    const notePreamble = notes.length
      ? `Founder preferences to respect (from memory): ${notes.join("; ")}\n\n`
      : "";

    const runId: Id<"agent_runs"> = await ctx.runMutation(
      internal.observability.startRun,
      { label: "app:full-pipeline" },
    );
    const demoMode = !hasOpenAI();

    // ── 1. Strategy (manager) ────────────────────────────────────────
    let strategy: StrategyResult;
    let strategyStepId: Id<"agent_steps"> | undefined;
    {
      let output = "";
      let tokens = 0;
      let costUsd = 0;
      let latencyMs = 0;
      let status = "ok";
      try {
        if (demoMode) {
          const t0 = Date.now();
          strategy = demoStrategy(idea);
          latencyMs = Date.now() - t0;
          output = JSON.stringify(strategy.personas).slice(0, 3000);
        } else {
          const call = await chatJson({
            system: STRATEGY_SYSTEM_PROMPT,
            user: notePreamble + buildStrategyUserPrompt(idea),
          });
          strategy = coerceStrategyResult(call.json, idea);
          tokens = call.tokens;
          costUsd = call.costUsd;
          latencyMs = call.latencyMs;
          output = call.content.slice(0, 3000);
        }
      } catch (e) {
        status = "error";
        strategy = demoStrategy(idea);
        output = `error: ${(e as Error).message}`;
      }
      strategyStepId = await ctx.runMutation(internal.observability.logStep, {
        runId,
        agent: "StrategyAgent",
        input: idea,
        output,
        tokens,
        costUsd,
        latencyMs,
        status,
      });
    }

    const personas = strategy.personas.slice(0, 4);

    // Persist project + personas now (so ids exist for candidates).
    const { projectId }: { projectId: Id<"projects">; roleToId: Record<string, Id<"personas">> } =
      await ctx.runMutation(internal.pipeline.persistProject, {
      ideaText: idea,
      domains: strategy.domains,
      challenges: strategy.challenges,
      missingExpertise: strategy.missingExpertise,
      risks: strategy.risks,
      clarifyingQuestions: strategy.clarifyingQuestions,
      personas,
      demoMode,
    });

    // ── 2. Talent scouts (sub-agents spawned per persona, in parallel) ─
    const useLinkup = hasLinkup();
    const raw: { personaRole: string; candidates: RawCandidate[] }[] = await Promise.all(
      personas.map(async (persona) => {
        const t0 = Date.now();
        let candidates: RawCandidate[] = [];
        let status = "ok";
        let note = "";
        try {
          candidates = useLinkup
            ? await linkupSearch(persona, strategy.domains)
            : demoCandidatesForPersona(persona, strategy.domains);
          if (useLinkup && candidates.length === 0) {
            // Linkup returned nothing — fall back so the persona still shows.
            candidates = demoCandidatesForPersona(persona, strategy.domains);
            note = " (linkup empty → demo fill)";
          }
        } catch (e) {
          status = "error";
          candidates = demoCandidatesForPersona(persona, strategy.domains);
          note = ` (error: ${(e as Error).message})`;
        }
        await ctx.runMutation(internal.observability.logStep, {
          runId,
          parentStepId: strategyStepId,
          agent: `TalentScout:${persona.role}`,
          input: buildLinkupQuery(persona, strategy.domains) + note,
          output: JSON.stringify(candidates).slice(0, 3000),
          tokens: 0,
          costUsd: 0,
          latencyMs: Date.now() - t0,
          status,
        });
        return { personaRole: persona.role, candidates };
      }),
    );

    // ── 3. Ranking (manager consolidates) ────────────────────────────
    let ranked: RankedCandidate[];
    {
      const fallback = demoRank(personas, raw);
      let output = "";
      let tokens = 0;
      let costUsd = 0;
      let latencyMs = 0;
      let status = "ok";
      try {
        if (demoMode) {
          ranked = fallback;
          output = `demo-rank ${ranked.length} candidates`;
        } else {
          const call = await chatJson({
            system: RANKING_SYSTEM_PROMPT,
            user:
              notePreamble +
              buildRankingUserPrompt({
                domains: strategy.domains,
                missingExpertise: strategy.missingExpertise,
                personas,
                raw,
              }),
            temperature: 0.2,
          });
          ranked = coerceRanked(call.json, fallback);
          tokens = call.tokens;
          costUsd = call.costUsd;
          latencyMs = call.latencyMs;
          output = call.content.slice(0, 3000);
        }
      } catch (e) {
        status = "error";
        ranked = fallback;
        output = `error: ${(e as Error).message}`;
      }
      await ctx.runMutation(internal.observability.logStep, {
        runId,
        parentStepId: strategyStepId,
        agent: "TalentScout(ranking)",
        input: `${raw.reduce((n, r) => n + r.candidates.length, 0)} raw candidates`,
        output,
        tokens,
        costUsd,
        latencyMs,
        status,
      });
    }

    const revealBestFit = args.revealBestFit ?? false;
    await ctx.runMutation(internal.pipeline.persistCandidates, {
      projectId,
      candidates: ranked,
      revealBestFit,
    });

    await ctx.runMutation(internal.observability.endRun, { runId, status: "done" });

    // Assemble the return payload (redact gated best-fit like getBundle does).
    const publicCandidates = ranked
      .slice()
      .sort((a, b) => b.confidence - a.confidence)
      .map((c) => {
        const locked = c.isBestFit && !revealBestFit;
        return {
          name: locked ? "🔒 Unlock to reveal" : c.name,
          headline: c.headline,
          location: c.location,
          whyMatch: c.whyMatch,
          expertise: c.expertise,
          profileUrls: locked ? [] : c.profileUrls,
          confidence: c.confidence,
          isBestFit: c.isBestFit,
          personaRole: c.personaRole,
          locked,
        };
      });

    return {
      projectId,
      demoMode,
      runId,
      usedLinkup: useLinkup,
      domains: strategy.domains,
      missingExpertise: strategy.missingExpertise,
      challenges: strategy.challenges,
      risks: strategy.risks,
      clarifyingQuestions: strategy.clarifyingQuestions,
      personas,
      candidates: publicCandidates,
    };
  },
});
