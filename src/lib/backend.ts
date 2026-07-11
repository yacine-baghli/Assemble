// Frontend backend adapter.
//
// Two modes, chosen at runtime from NEXT_PUBLIC_CONVEX_URL:
//   • Convex mode  — real backend (Convex actions/mutations; real OpenAI/Linkup
//     when their keys are set as Convex env vars). Used in the graded demo.
//   • Demo mode    — no accounts needed. Thin Next route handlers run the same
//     deterministic decomposition so the funnel works locally and offline.
//
// We reference Convex functions by name via makeFunctionReference so the app
// compiles and ships even before `npx convex dev` has generated _generated/.

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
export const convexEnabled = !!CONVEX_URL;

let client: ConvexHttpClient | null = null;
function getClient(): ConvexHttpClient {
  if (!client) client = new ConvexHttpClient(CONVEX_URL as string);
  return client;
}

export type PreviewCandidate = {
  name: string;
  headline: string;
  whyMatch: string;
  expertise: string[];
};

export type TeaserResult = {
  projectId: string;
  demoMode: boolean;
  domains: string[];
  missingExpertise: string[];
  challenges: string[];
  clarifyingQuestions: string[];
  previewCandidates: PreviewCandidate[];
};

export async function teaserPreview(idea: string): Promise<TeaserResult> {
  if (convexEnabled) {
    const ref = makeFunctionReference<"action">("strategy:runTeaserPreview");
    return (await getClient().action(ref, { idea })) as TeaserResult;
  }
  const res = await fetch("/api/demo/strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });
  if (!res.ok) throw new Error(`Preview failed (${res.status})`);
  return (await res.json()) as TeaserResult;
}

export type Persona = {
  role: string;
  requiredSkills: string[];
  rationale: string;
};

export type Candidate = {
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

export type PipelineResult = {
  projectId: string;
  demoMode: boolean;
  runId?: string;
  usedLinkup: boolean;
  domains: string[];
  missingExpertise: string[];
  challenges: string[];
  risks: string[];
  clarifyingQuestions: string[];
  personas: Persona[];
  candidates: Candidate[];
};

export async function runPipeline(
  idea: string,
  revealBestFit = true,
  notes: string[] = [],
): Promise<PipelineResult> {
  if (convexEnabled) {
    const ref = makeFunctionReference<"action">("scout:runFullPipeline");
    return (await getClient().action(ref, {
      idea,
      revealBestFit,
      notes,
    })) as PipelineResult;
  }
  const res = await fetch("/api/demo/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, revealBestFit, notes }),
  });
  if (!res.ok) throw new Error(`Pipeline failed (${res.status})`);
  return (await res.json()) as PipelineResult;
}

// ── Payments / unlock (Phase 4) ──────────────────────────────────────
export async function loadProjectResult(
  projectId: string,
): Promise<PipelineResult | null> {
  if (!convexEnabled || projectId.startsWith("demo-")) return null;
  const ref = makeFunctionReference<"query">("pipeline:getProjectResult");
  return (await getClient().query(ref, { projectId })) as PipelineResult | null;
}

export async function createCheckout(
  projectId: string,
  returnUrl: string,
): Promise<{ url: string | null; reason?: string }> {
  if (!convexEnabled || projectId.startsWith("demo-")) return { url: null };
  const ref = makeFunctionReference<"action">("payments:createCheckout");
  return (await getClient().action(ref, { projectId, returnUrl })) as {
    url: string | null;
    reason?: string;
  };
}

export async function unlockProject(
  projectId: string,
  simulated: boolean,
): Promise<{ ok: boolean }> {
  if (!convexEnabled || projectId.startsWith("demo-")) return { ok: false };
  const ref = makeFunctionReference<"action">("payments:unlock");
  return (await getClient().action(ref, { projectId, simulated })) as {
    ok: boolean;
  };
}

// ── Voice (Phase 2) ──────────────────────────────────────────────────
export type Capabilities = {
  openai: boolean;
  linkup: boolean;
  elevenlabsStt: boolean;
  elevenlabsTts: boolean;
  resend: boolean;
  dodo: boolean;
};

const NO_CAPS: Capabilities = {
  openai: false,
  linkup: false,
  elevenlabsStt: false,
  elevenlabsTts: false,
  resend: false,
  dodo: false,
};

export async function getCapabilities(): Promise<Capabilities> {
  if (!convexEnabled) return NO_CAPS;
  try {
    const ref = makeFunctionReference<"query">("config:capabilities");
    return (await getClient().query(ref, {})) as Capabilities;
  } catch {
    return NO_CAPS;
  }
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
): Promise<{ text: string; ok: boolean }> {
  if (!convexEnabled) return { text: "", ok: false };
  const ref = makeFunctionReference<"action">("voice:transcribe");
  return (await getClient().action(ref, { audioBase64, mimeType })) as {
    text: string;
    ok: boolean;
  };
}

export async function synthesizeSpeech(
  text: string,
): Promise<{ audioBase64: string; mime: string; ok: boolean }> {
  if (!convexEnabled) return { audioBase64: "", mime: "audio/mpeg", ok: false };
  const ref = makeFunctionReference<"action">("voice:speak");
  return (await getClient().action(ref, { text })) as {
    audioBase64: string;
    mime: string;
    ok: boolean;
  };
}

// ── Outreach (Phase 3) ───────────────────────────────────────────────
export type OutreachContext = {
  candidateName: string;
  candidateHeadline: string;
  whyMatch: string;
  personaRole: string;
  ideaText: string;
  domains: string[];
  senderName?: string;
  channel: "email" | "linkedin";
};

export type OutreachDraft = { subject: string; body: string; demoMode: boolean };

export async function draftOutreach(
  context: OutreachContext,
): Promise<OutreachDraft> {
  if (convexEnabled) {
    const ref = makeFunctionReference<"action">("outreach:draft");
    return (await getClient().action(ref, { context })) as OutreachDraft;
  }
  const res = await fetch("/api/demo/outreach/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) throw new Error(`Draft failed (${res.status})`);
  return (await res.json()) as OutreachDraft;
}

export async function sendOutreachEmail(args: {
  toEmail: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<{ ok: boolean; reason?: string; id?: string }> {
  if (!convexEnabled) return { ok: false, reason: "no_backend" };
  const ref = makeFunctionReference<"action">("outreach:sendEmail");
  return (await getClient().action(ref, args)) as {
    ok: boolean;
    reason?: string;
    id?: string;
  };
}

// ── Observability (Phase 5) ──────────────────────────────────────────
export type AgentRun = {
  _id: string;
  label: string;
  status: string;
  startedAt: number;
  endedAt?: number;
  totalTokens: number;
  totalCostUsd: number;
};

export type AgentStep = {
  _id: string;
  runId: string;
  parentStepId?: string;
  agent: string;
  input: string;
  output: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  status?: string;
  createdAt: number;
};

export async function listRuns(): Promise<AgentRun[]> {
  if (!convexEnabled) return [];
  const ref = makeFunctionReference<"query">("observability:listRuns");
  return (await getClient().query(ref, {})) as AgentRun[];
}

export async function getRun(
  runId: string,
): Promise<{ run: AgentRun; steps: AgentStep[] } | null> {
  if (!convexEnabled) return null;
  const ref = makeFunctionReference<"query">("observability:getRun");
  return (await getClient().query(ref, { runId })) as {
    run: AgentRun;
    steps: AgentStep[];
  } | null;
}

export async function captureEmail(args: {
  email: string;
  projectId?: string;
  source?: string;
}): Promise<{ isNew: boolean }> {
  if (convexEnabled) {
    const ref = makeFunctionReference<"mutation">("leads:capture");
    const projectId = args.projectId?.startsWith("demo-") ? undefined : args.projectId;
    return (await getClient().mutation(ref, {
      email: args.email,
      projectId,
      source: args.source,
    })) as { isNew: boolean };
  }
  const res = await fetch("/api/demo/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Capture failed (${res.status})`);
  }
  return (await res.json()) as { isNew: boolean };
}
