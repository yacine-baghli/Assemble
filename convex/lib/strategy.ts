// Pure, dependency-free strategy logic.
// Imported by both the Convex action (real OpenAI path) and the Next dev
// fallback route (deterministic demo path). No Node / Convex imports here.

export type Persona = {
  role: string;
  requiredSkills: string[];
  rationale: string;
};

export type PreviewCandidate = {
  name: string;
  headline: string;
  whyMatch: string;
  expertise: string[];
};

export type StrategyResult = {
  domains: string[];
  challenges: string[];
  missingExpertise: string[];
  risks: string[];
  clarifyingQuestions: string[];
  personas: Persona[];
  previewCandidates: PreviewCandidate[];
};

export const STRATEGY_SYSTEM_PROMPT = `You are the Strategy Agent for "Assemble", a product that turns a raw startup idea into a founding team.
Given a user's idea, decompose it into:
- domains: the fields/industries this idea touches (2-4 short labels)
- challenges: the hardest problems to solve first (3-5 concise items)
- missingExpertise: the concrete expertises a solo founder is most likely missing (3-5 items)
- risks: the top execution/market risks (2-4 items)
- clarifyingQuestions: 1-3 questions ONLY if the idea is under-specified, else []
- personas: for each missing expertise, an archetypal teammate { role, requiredSkills[3-6], rationale }
- previewCandidates: 3 archetypal (not real) people who would fit, { name, headline, whyMatch, expertise[] }
Respond as strict minified JSON matching this shape. Names in previewCandidates must be plausible but clearly generic archetypes.`;

export function buildStrategyUserPrompt(idea: string): string {
  return `IDEA:\n${idea.trim()}\n\nReturn the JSON now.`;
}

// ── Deterministic demo fallback (no API key needed) ──────────────────
// Heuristic keyword → domain/expertise mapping so the teaser produces a
// convincing, idea-specific preview offline. The real path (OpenAI) replaces
// this whenever OPENAI_API_KEY is configured on Convex.

type Rule = {
  match: RegExp;
  domain: string;
  expertise: string[];
  persona: Persona;
};

const RULES: Rule[] = [
  {
    match: /neuro|brain|neural|microflu|bio|lab|cell|gene|protein|clinic|medical|health|patient|diagnos/i,
    domain: "Biotech / Life Sciences",
    expertise: ["Wet-lab / bioengineering", "Regulatory & clinical validation"],
    persona: {
      role: "Biotech Co-founder (CSO)",
      requiredSkills: ["Wet-lab protocols", "Microfluidics", "Grant writing", "IP / regulatory"],
      rationale: "The core innovation is physical/biological — you need someone who can run and validate experiments, not just model them.",
    },
  },
  {
    match: /ai|ml|model|llm|agent|data|vision|nlp|inference|train|dataset/i,
    domain: "Applied AI / ML",
    expertise: ["Applied ML engineering", "Data pipelines & MLOps"],
    persona: {
      role: "Founding ML Engineer",
      requiredSkills: ["Model training & eval", "Inference infra", "Python", "Data engineering"],
      rationale: "Turning the AI concept into a reliable, evaluated product needs someone who owns models end-to-end.",
    },
  },
  {
    match: /market|growth|brand|social|content|community|viral|acqui|seo|funnel|creator/i,
    domain: "Growth & Distribution",
    expertise: ["Growth marketing", "Community & content"],
    persona: {
      role: "Head of Growth",
      requiredSkills: ["Performance marketing", "Content strategy", "Analytics", "Community building"],
      rationale: "A great product with no distribution loses; you need an owner for the acquisition loop.",
    },
  },
  {
    match: /pay|fintech|bank|invest|trading|ledger|crypto|wallet|revenue|billing/i,
    domain: "Fintech",
    expertise: ["Payments & compliance", "Financial modeling"],
    persona: {
      role: "Fintech / Compliance Lead",
      requiredSkills: ["Payments rails", "KYC/AML", "Risk", "Financial licensing"],
      rationale: "Money movement is a regulatory minefield; a compliance-fluent co-founder de-risks the whole model.",
    },
  },
  {
    match: /hardware|device|robot|iot|sensor|manufactur|supply|logistic|drone|3d/i,
    domain: "Hardware / Robotics",
    expertise: ["Hardware / mechatronics", "Manufacturing & supply chain"],
    persona: {
      role: "Head of Hardware",
      requiredSkills: ["Electronics design", "Firmware", "DFM", "Supplier management"],
      rationale: "Atoms are harder than bits — you need someone who has shipped a physical product before.",
    },
  },
  {
    match: /market ?place|two-?sided|b2b|saas|platform|enterprise|api/i,
    domain: "B2B SaaS / Platform",
    expertise: ["B2B product & sales", "Platform engineering"],
    persona: {
      role: "Founding Product Engineer",
      requiredSkills: ["Full-stack", "System design", "B2B UX", "API design"],
      rationale: "A platform needs someone who can both build the core system and shape it around real customer workflows.",
    },
  },
];

const GENERIC_TECH: Persona = {
  role: "Founding Engineer (CTO)",
  requiredSkills: ["Full-stack development", "System architecture", "Rapid prototyping", "DevOps"],
  rationale: "Every early idea needs someone who can ship the first working version fast and own the technical direction.",
};

const GENERIC_GTM: Persona = {
  role: "Go-to-Market Co-founder",
  requiredSkills: ["Sales", "Positioning", "Customer discovery", "Partnerships"],
  rationale: "You need a counterpart focused on customers and revenue so the founder-market fit is complete.",
};

const FIRST_NAMES = ["Maya", "Léo", "Amara", "Kai", "Sofia", "Noah", "Priya", "Jonas", "Yuki", "Diego"];
const LAST_INITIALS = ["R.", "M.", "K.", "B.", "T.", "L.", "S.", "N."];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

export function demoStrategy(idea: string): StrategyResult {
  const seed = seedFrom(idea);
  const matched = RULES.filter((r) => r.match.test(idea));

  const domains = Array.from(new Set(matched.map((r) => r.domain)));
  if (domains.length === 0) domains.push("Consumer Tech");
  domains.push("Product & Engineering");

  const missingExpertise = Array.from(
    new Set(matched.flatMap((r) => r.expertise)),
  );

  const personas: Persona[] = [];
  const seen = new Set<string>();
  for (const r of matched) {
    if (!seen.has(r.persona.role)) {
      personas.push(r.persona);
      seen.add(r.persona.role);
    }
  }
  // Always ensure a technical and a GTM co-founder are represented.
  if (!personas.some((p) => /engineer|cto|hardware|ml/i.test(p.role))) {
    personas.unshift(GENERIC_TECH);
    missingExpertise.unshift("Technical execution");
  }
  if (!personas.some((p) => /growth|market|sales|gtm/i.test(p.role))) {
    personas.push(GENERIC_GTM);
    missingExpertise.push("Go-to-market");
  }

  const challenges = [
    `Prove the core of "${shorten(idea)}" works with a minimal experiment`,
    "Find the first 10 users who feel the pain acutely",
    "Assemble complementary co-founders before building",
  ];

  const risks = [
    "Solo-founder skill gaps slow execution",
    "Building before validating demand",
  ];

  const clarifyingQuestions = idea.trim().split(/\s+/).length < 8
    ? [
        "Who feels this problem most acutely today?",
        "What's the single riskiest assumption in this idea?",
      ]
    : [];

  const previewCandidates: PreviewCandidate[] = personas.slice(0, 3).map((p, i) => ({
    name: `${pick(FIRST_NAMES, seed + i)} ${pick(LAST_INITIALS, seed + i * 3)}`,
    headline: `${p.role} · ${p.requiredSkills[0]}`,
    whyMatch: p.rationale,
    expertise: p.requiredSkills.slice(0, 3),
  }));
  while (previewCandidates.length < 3) {
    const i = previewCandidates.length;
    previewCandidates.push({
      name: `${pick(FIRST_NAMES, seed + i * 7)} ${pick(LAST_INITIALS, seed + i)}`,
      headline: `Founding ${pick(["Engineer", "Designer", "Operator"], seed + i)} · early-stage`,
      whyMatch: "Complementary skills to round out the founding team.",
      expertise: ["Startups", "0→1 building", "Ownership"],
    });
  }

  return {
    domains: Array.from(new Set(domains)),
    challenges,
    missingExpertise: Array.from(new Set(missingExpertise)),
    risks,
    clarifyingQuestions,
    personas,
    previewCandidates,
  };
}

function shorten(idea: string): string {
  const t = idea.trim().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 45) + "…" : t;
}

// Best-effort parse of an LLM JSON response into a StrategyResult.
export function coerceStrategyResult(raw: unknown, idea: string): StrategyResult {
  const fallback = demoStrategy(idea);
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const arr = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((i) => typeof i === "string") : [];
  const personas = Array.isArray(o.personas)
    ? (o.personas as unknown[])
        .map((p) => {
          const pp = (p ?? {}) as Record<string, unknown>;
          return {
            role: String(pp.role ?? ""),
            requiredSkills: arr(pp.requiredSkills),
            rationale: String(pp.rationale ?? ""),
          };
        })
        .filter((p) => p.role)
    : fallback.personas;
  const previewCandidates = Array.isArray(o.previewCandidates)
    ? (o.previewCandidates as unknown[])
        .map((c) => {
          const cc = (c ?? {}) as Record<string, unknown>;
          return {
            name: String(cc.name ?? ""),
            headline: String(cc.headline ?? ""),
            whyMatch: String(cc.whyMatch ?? ""),
            expertise: arr(cc.expertise),
          };
        })
        .filter((c) => c.name)
    : fallback.previewCandidates;

  return {
    domains: arr(o.domains).length ? arr(o.domains) : fallback.domains,
    challenges: arr(o.challenges).length ? arr(o.challenges) : fallback.challenges,
    missingExpertise: arr(o.missingExpertise).length
      ? arr(o.missingExpertise)
      : fallback.missingExpertise,
    risks: arr(o.risks).length ? arr(o.risks) : fallback.risks,
    clarifyingQuestions: arr(o.clarifyingQuestions),
    personas: personas.length ? personas : fallback.personas,
    previewCandidates: previewCandidates.length ? previewCandidates : fallback.previewCandidates,
  };
}
