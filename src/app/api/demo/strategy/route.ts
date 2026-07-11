import { NextResponse } from "next/server";
import { demoStrategy } from "../../../../../convex/lib/strategy";

// Dev/offline fallback for the teaser when Convex is not configured.
// Mirrors the shape returned by the Convex `strategy:runTeaserPreview` action.
export async function POST(req: Request) {
  const { idea } = (await req.json().catch(() => ({}))) as { idea?: string };
  const text = (idea ?? "").trim().slice(0, 2000);
  if (text.length < 3) {
    return NextResponse.json({ error: "Idea is too short" }, { status: 400 });
  }
  const result = demoStrategy(text);
  return NextResponse.json({
    projectId: `demo-${Date.now()}`,
    demoMode: true,
    domains: result.domains,
    missingExpertise: result.missingExpertise,
    challenges: result.challenges,
    clarifyingQuestions: result.clarifyingQuestions,
    previewCandidates: result.previewCandidates,
  });
}
