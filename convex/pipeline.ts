import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const personaValidator = v.object({
  role: v.string(),
  requiredSkills: v.array(v.string()),
  rationale: v.string(),
});

const candidateValidator = v.object({
  name: v.string(),
  headline: v.string(),
  location: v.optional(v.string()),
  whyMatch: v.string(),
  expertise: v.array(v.string()),
  profileUrls: v.array(v.string()),
  confidence: v.number(),
  isBestFit: v.boolean(),
  personaRole: v.string(),
});

// Create the full project + personas, return ids (called from the scout action).
export const persistProject = internalMutation({
  args: {
    ideaText: v.string(),
    domains: v.array(v.string()),
    challenges: v.array(v.string()),
    missingExpertise: v.array(v.string()),
    risks: v.array(v.string()),
    clarifyingQuestions: v.array(v.string()),
    personas: v.array(personaValidator),
    demoMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      ideaText: args.ideaText,
      domains: args.domains,
      challenges: args.challenges,
      missingExpertise: args.missingExpertise,
      risks: args.risks,
      clarifyingQuestions: args.clarifyingQuestions,
      status: "scouting",
      demoMode: args.demoMode,
      createdAt: Date.now(),
    });
    const roleToId: Record<string, Id<"personas">> = {};
    for (const p of args.personas) {
      const id = await ctx.db.insert("personas", {
        projectId,
        role: p.role,
        requiredSkills: p.requiredSkills,
        rationale: p.rationale,
      });
      roleToId[p.role] = id;
    }
    return { projectId, roleToId };
  },
});

// Insert ranked candidates. Freemium gating: the single best-fit is `gated`
// unless the caller says it has been revealed (Phase 4 / Dodo unlock).
export const persistCandidates = internalMutation({
  args: {
    projectId: v.id("projects"),
    candidates: v.array(candidateValidator),
    revealBestFit: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Map persona role -> id for linking.
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const roleToId: Record<string, Id<"personas">> = {};
    for (const p of personas) roleToId[p.role] = p._id;

    for (const c of args.candidates) {
      await ctx.db.insert("candidates", {
        projectId: args.projectId,
        personaId: roleToId[c.personaRole],
        name: c.name,
        headline: c.headline,
        location: c.location,
        whyMatch: c.whyMatch,
        expertise: c.expertise,
        profileUrls: c.profileUrls,
        confidence: c.confidence,
        isBestFit: c.isBestFit,
        gated: c.isBestFit && !args.revealBestFit,
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(args.projectId, { status: "ready" });
  },
});

// Reactive bundle for the app UI: project + personas + candidates.
export const getBundle = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    // Redact gated best-fit details from the client payload.
    const safeCandidates = candidates
      .sort((a, b) => b.confidence - a.confidence)
      .map((c) =>
        c.gated
          ? {
              ...c,
              name: "🔒 Unlock to reveal",
              profileUrls: [],
              whyMatch: c.whyMatch,
              locked: true as const,
            }
          : { ...c, locked: false as const },
      );
    return { project, personas, candidates: safeCandidates };
  },
});

// Un-gate the best-fit after a successful payment (Dodo) or a demo unlock.
export const revealBestFit = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const c of candidates) {
      if (c.gated) await ctx.db.patch(c._id, { gated: false });
    }
    return { ok: true };
  },
});

export const recordPayment = internalMutation({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    await ctx.db.insert("payments", {
      projectId: args.projectId,
      userId: project?.userId,
      provider: "dodo",
      amount: args.amount,
      status: args.status,
      at: Date.now(),
    });
    if (project?.userId) {
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_user", (q) => q.eq("userId", project.userId!))
        .first();
      if (usage) await ctx.db.patch(usage._id, { revealedBestFit: true });
    }
  },
});

// Full PipelineResult-shaped payload for a stored project (used after a
// payment redirect to rebuild the view with the best-fit revealed).
export const getProjectResult = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const publicCandidates = candidates
      .sort((a, b) => b.confidence - a.confidence)
      .map((c) => ({
        name: c.gated ? "🔒 Unlock to reveal" : c.name,
        headline: c.headline,
        location: c.location,
        whyMatch: c.whyMatch,
        expertise: c.expertise,
        profileUrls: c.gated ? [] : c.profileUrls,
        confidence: c.confidence,
        isBestFit: c.isBestFit,
        personaRole: c.personaRole,
        locked: c.gated,
      }));
    return {
      projectId: args.projectId,
      demoMode: project.demoMode ?? false,
      usedLinkup: false,
      domains: project.domains,
      missingExpertise: project.missingExpertise,
      challenges: project.challenges,
      risks: project.risks,
      clarifyingQuestions: project.clarifyingQuestions ?? [],
      personas: personas.map((p) => ({
        role: p.role,
        requiredSkills: p.requiredSkills,
        rationale: p.rationale,
      })),
      candidates: publicCandidates,
    };
  },
});

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").order("desc").take(25);
  },
});

// Record accept/reject — feeds preferences memory (Phase 4).
export const decide = mutation({
  args: {
    candidateId: v.id("candidates"),
    decision: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");
    await ctx.db.insert("decisions", {
      projectId: candidate.projectId,
      candidateId: args.candidateId,
      decision: args.decision,
      at: Date.now(),
    });
    return { ok: true };
  },
});
