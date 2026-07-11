import { NextResponse } from "next/server";
import { demoStrategy } from "../../../../../convex/lib/strategy";
import {
  demoCandidatesForPersona,
  demoRank,
  type RawCandidate,
} from "../../../../../convex/lib/scout";

// Dev/offline fallback for the full agency pipeline (mirrors scout:runFullPipeline).
export async function POST(req: Request) {
  const { idea, revealBestFit } = (await req.json().catch(() => ({}))) as {
    idea?: string;
    revealBestFit?: boolean;
  };
  const text = (idea ?? "").trim().slice(0, 2000);
  if (text.length < 8) {
    return NextResponse.json({ error: "Idea is too short" }, { status: 400 });
  }
  const strategy = demoStrategy(text);
  const personas = strategy.personas.slice(0, 4);
  const raw: { personaRole: string; candidates: RawCandidate[] }[] = personas.map(
    (p) => ({
      personaRole: p.role,
      candidates: demoCandidatesForPersona(p, strategy.domains),
    }),
  );
  const ranked = demoRank(personas, raw);
  const reveal = revealBestFit ?? true;

  const candidates = ranked
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .map((c) => {
      const locked = c.isBestFit && !reveal;
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

  return NextResponse.json({
    projectId: `demo-${Date.now()}`,
    demoMode: true,
    usedLinkup: false,
    domains: strategy.domains,
    missingExpertise: strategy.missingExpertise,
    challenges: strategy.challenges,
    risks: strategy.risks,
    clarifyingQuestions: strategy.clarifyingQuestions,
    personas,
    candidates,
  });
}
