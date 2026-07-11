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
): Promise<PipelineResult> {
  if (convexEnabled) {
    const ref = makeFunctionReference<"action">("scout:runFullPipeline");
    return (await getClient().action(ref, { idea, revealBestFit })) as PipelineResult;
  }
  const res = await fetch("/api/demo/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, revealBestFit }),
  });
  if (!res.ok) throw new Error(`Pipeline failed (${res.status})`);
  return (await res.json()) as PipelineResult;
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
