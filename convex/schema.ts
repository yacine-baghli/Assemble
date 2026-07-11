import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.optional(v.string()),
    email: v.string(),
    plan: v.union(v.literal("free"), v.literal("paid")),
    source: v.optional(v.string()), // "teaser" | "app"
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  projects: defineTable({
    userId: v.optional(v.id("users")),
    ideaText: v.string(),
    ideaAudioUrl: v.optional(v.string()),
    domains: v.array(v.string()),
    challenges: v.array(v.string()),
    missingExpertise: v.array(v.string()),
    risks: v.array(v.string()),
    clarifyingQuestions: v.optional(v.array(v.string())),
    status: v.string(), // "draft" | "scouting" | "ready"
    demoMode: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  personas: defineTable({
    projectId: v.id("projects"),
    role: v.string(),
    requiredSkills: v.array(v.string()),
    rationale: v.string(),
  }).index("by_project", ["projectId"]),

  candidates: defineTable({
    projectId: v.id("projects"),
    personaId: v.optional(v.id("personas")),
    name: v.string(),
    headline: v.string(),
    location: v.optional(v.string()),
    whyMatch: v.string(),
    expertise: v.array(v.string()),
    profileUrls: v.array(v.string()),
    confidence: v.number(),
    isBestFit: v.boolean(),
    gated: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_persona", ["personaId"]),

  outreach: defineTable({
    candidateId: v.id("candidates"),
    channel: v.union(v.literal("email"), v.literal("linkedin")),
    toEmail: v.optional(v.string()),
    subject: v.optional(v.string()),
    draft: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("sent"),
      v.literal("replied"),
    ),
    sentAt: v.optional(v.number()),
  }).index("by_candidate", ["candidateId"]),

  decisions: defineTable({
    projectId: v.optional(v.id("projects")),
    candidateId: v.id("candidates"),
    decision: v.union(v.literal("accepted"), v.literal("rejected")),
    at: v.number(),
  }).index("by_candidate", ["candidateId"]),

  preferences: defineTable({
    userId: v.id("users"),
    notes: v.array(v.string()),
  }).index("by_user", ["userId"]),

  usage: defineTable({
    userId: v.id("users"),
    projectCount: v.number(),
    revealedBestFit: v.boolean(),
  }).index("by_user", ["userId"]),

  payments: defineTable({
    userId: v.optional(v.id("users")),
    projectId: v.optional(v.id("projects")),
    provider: v.string(), // "dodo"
    amount: v.number(),
    status: v.string(), // "pending" | "succeeded" | "failed"
    at: v.number(),
  }).index("by_project", ["projectId"]),

  // ── Observability ────────────────────────────────────────────────
  agent_runs: defineTable({
    projectId: v.optional(v.id("projects")),
    label: v.string(),
    status: v.string(), // "running" | "done" | "error"
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    totalTokens: v.number(),
    totalCostUsd: v.number(),
  }).index("by_project", ["projectId"]),

  agent_steps: defineTable({
    runId: v.id("agent_runs"),
    parentStepId: v.optional(v.id("agent_steps")),
    agent: v.string(),
    input: v.string(),
    output: v.string(),
    tokens: v.number(),
    costUsd: v.number(),
    latencyMs: v.number(),
    status: v.optional(v.string()), // "ok" | "error"
    createdAt: v.number(),
  }).index("by_run", ["runId"]),
});
