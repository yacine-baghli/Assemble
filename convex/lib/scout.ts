// Pure talent-scout logic: Linkup query/schema builders, ranking prompt, and a
// deterministic demo fallback. No Node/Convex/SDK imports here.

import type { Persona } from "./strategy";

export type RawCandidate = {
  name: string;
  headline: string;
  location?: string;
  expertise: string[];
  profileUrl: string;
  evidence?: string;
};

export type RankedCandidate = {
  name: string;
  headline: string;
  location?: string;
  whyMatch: string;
  expertise: string[];
  profileUrls: string[];
  confidence: number; // 0..1
  isBestFit: boolean;
  personaRole: string;
};

// JSON schema handed to Linkup for structured people search.
export const LINKUP_PEOPLE_SCHEMA = {
  type: "object",
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          headline: { type: "string", description: "current role / one-line bio" },
          location: { type: "string" },
          expertise: { type: "array", items: { type: "string" } },
          profileUrl: { type: "string", description: "public LinkedIn/GitHub/Scholar URL" },
          evidence: { type: "string", description: "why this person fits, from the page" },
        },
        required: ["name", "headline", "profileUrl"],
      },
    },
  },
  required: ["candidates"],
};

export function buildLinkupQuery(persona: Persona, domains: string[]): string {
  const skills = persona.requiredSkills.join(", ");
  const domainStr = domains.slice(0, 3).join(", ");
  return `Find real, named people who could join an early-stage startup (domains: ${domainStr}) as a "${persona.role}". They should have experience in: ${skills}. For each person return their full name, current role/headline, location, areas of expertise, and a public profile URL (LinkedIn, GitHub, or Google Scholar).`;
}

export const RANKING_SYSTEM_PROMPT = `You are the Talent Scout ranking agent for "Assemble".
Given a project (domains + missing expertise), a set of personas (roles to fill), and raw candidates sourced from the public web, produce a ranked, de-duplicated shortlist.
For EACH candidate output:
- name, headline, location (if known)
- expertise: string[]
- profileUrls: string[] (keep the real URLs you were given; never invent emails or URLs)
- whyMatch: one concrete sentence tying this person's evidence to the persona they fill
- confidence: number 0..1
- personaRole: which persona they fill
Also mark exactly ONE overall best-fit candidate with isBestFit=true (the single strongest hire); all others isBestFit=false.
De-duplicate people who appear more than once (same name/org). Respond as strict minified JSON: {"candidates":[...]}.`;

export function buildRankingUserPrompt(args: {
  domains: string[];
  missingExpertise: string[];
  personas: Persona[];
  raw: { personaRole: string; candidates: RawCandidate[] }[];
}): string {
  return JSON.stringify({
    project: { domains: args.domains, missingExpertise: args.missingExpertise },
    personas: args.personas,
    sourced: args.raw,
  });
}

// ── Deterministic demo fallback ──────────────────────────────────────
const DEMO_PEOPLE: Record<string, { name: string; org: string }[]> = {
  default: [
    { name: "Alex Rivera", org: "ex-Stripe" },
    { name: "Priya Nair", org: "ex-DeepMind" },
    { name: "Marco Bianchi", org: "ex-Shopify" },
  ],
};

function seed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function demoCandidatesForPersona(
  persona: Persona,
  domains: string[],
): RawCandidate[] {
  const base = DEMO_PEOPLE.default;
  return base.map((p, i) => {
    const q = encodeURIComponent(`${persona.role} ${persona.requiredSkills[0]} ${domains[0] ?? ""}`);
    return {
      name: p.name,
      headline: `${persona.role} · ${p.org}`,
      location: ["San Francisco", "London", "Berlin"][i % 3],
      expertise: persona.requiredSkills.slice(0, 3),
      // Honest placeholder: a live search link, not a fabricated profile.
      profileUrl: `https://www.google.com/search?q=${q}`,
      evidence: `Archetypal match for ${persona.role} (demo mode — connect Linkup for real sourcing).`,
    };
  });
}

export function demoRank(
  personas: Persona[],
  raw: { personaRole: string; candidates: RawCandidate[] }[],
): RankedCandidate[] {
  const out: RankedCandidate[] = [];
  raw.forEach((group) => {
    const persona = personas.find((p) => p.role === group.personaRole);
    group.candidates.forEach((c, i) => {
      const s = seed(c.name + group.personaRole);
      out.push({
        name: c.name,
        headline: c.headline,
        location: c.location,
        whyMatch:
          persona?.rationale ??
          `Strong overlap with the ${group.personaRole} requirements.`,
        expertise: c.expertise,
        profileUrls: [c.profileUrl],
        confidence: 0.6 + ((s % 35) / 100), // 0.60..0.94
        isBestFit: false,
        personaRole: group.personaRole,
      });
    });
  });
  // Highest confidence becomes best-fit.
  if (out.length) {
    let best = 0;
    out.forEach((c, i) => {
      if (c.confidence > out[best].confidence) best = i;
    });
    out[best].isBestFit = true;
  }
  return out;
}

export function coerceRanked(raw: unknown, fallback: RankedCandidate[]): RankedCandidate[] {
  if (!raw || typeof raw !== "object") return fallback;
  const arr = (raw as { candidates?: unknown }).candidates;
  if (!Array.isArray(arr)) return fallback;
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  const sa = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((i) => typeof i === "string") : [];
  const mapped = arr
    .map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      return {
        name: s(o.name),
        headline: s(o.headline),
        location: s(o.location) || undefined,
        whyMatch: s(o.whyMatch),
        expertise: sa(o.expertise),
        profileUrls: sa(o.profileUrls),
        confidence:
          typeof o.confidence === "number"
            ? Math.max(0, Math.min(1, o.confidence))
            : 0.7,
        isBestFit: o.isBestFit === true,
        personaRole: s(o.personaRole),
      };
    })
    .filter((c) => c.name);
  if (!mapped.length) return fallback;
  // Guarantee exactly one best-fit.
  const bestCount = mapped.filter((c) => c.isBestFit).length;
  if (bestCount !== 1) {
    mapped.forEach((c) => (c.isBestFit = false));
    let best = 0;
    mapped.forEach((c, i) => {
      if (c.confidence > mapped[best].confidence) best = i;
    });
    mapped[best].isBestFit = true;
  }
  return mapped;
}
