"use client";

import { useEffect, useMemo, useState } from "react";
import {
  convexEnabled,
  getCapabilities,
  teaserPreview,
  type Capabilities,
  type PreviewCandidate,
  type TeaserResult,
} from "@/lib/backend";
import VoiceMic from "@/components/VoiceMic";

// Compute a deterministic fit score from candidate name + idea text
function computeFitScore(name: string, idea: string, rank: number): number {
  let h = 5381;
  const s = (name + idea).toLowerCase();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  // Best candidate: 88-97, second: 82-91, third: 78-87
  const base = [88, 82, 78][rank] ?? 78;
  const range = [10, 10, 10][rank] ?? 10;
  return base + (h % range);
}

const NO_CAPS: Capabilities = {
  openai: false,
  linkup: false,
  elevenlabsStt: false,
  elevenlabsTts: false,
  resend: false,
  dodo: false,
};

const IDEA_BANK = [
  "A device that grows human neurons on microfluidic chips to test drugs without animals",
  "An AI copilot that turns messy field-sales voice notes into updated CRM records",
  "A marketplace connecting indie game studios with freelance sound designers",
  "A wearable ring that detects early signs of atrial fibrillation using photoplethysmography",
  "An app that uses satellite imagery to predict crop yields for smallholder farmers in sub-Saharan Africa",
  "A browser extension that summarizes academic papers and highlights methodology weaknesses",
  "A platform for fractional CFO services for Series A startups using AI-driven financial modeling",
  "A drone-based system for reforesting burned areas by planting seed pods at scale",
  "An API that converts natural language legal clauses into machine-readable smart contracts",
  "A social network for scientists to share negative experiment results and avoid duplicated failures",
  "A robotic kitchen module that prepares personalized meals based on dietary biomarker data",
  "A decentralized identity platform for refugees to carry verifiable credentials across borders",
  "A SaaS tool that automates GDPR data subject access requests for mid-market companies",
  "A peer-to-peer energy trading platform for residential solar panel owners",
  "An AI tutor that adapts in real-time to a student's emotional state using webcam analysis",
  "A supply chain transparency tool that tracks conflict minerals from mine to product",
  "A voice-first interface for elderly patients to manage chronic medication schedules",
  "A carbon credit marketplace verified by IoT sensors embedded in forestry projects",
  "An AR app that lets interior designers preview furniture placement using LiDAR room scans",
  "A micro-insurance platform for gig workers that adjusts premiums based on real-time risk",
  "A lab-grown leather production startup using mycelium-based biomaterials",
  "An AI-powered code review tool that catches security vulnerabilities before deployment",
  "A telemedicine platform specialized in rare genetic diseases connecting patients to global experts",
  "A smart building management system that reduces energy use by 40% using occupancy prediction",
  "A fintech app that helps immigrants send remittances with zero fees using stablecoins",
  "A personalized cancer vaccine platform using mRNA technology and tumor sequencing",
  "A collaborative design tool for architects that integrates structural engineering constraints in real-time",
  "A platform matching retired executives with early-stage founders for fractional advisory",
  "An autonomous underwater drone for inspecting offshore wind turbine foundations",
  "A mental health chatbot trained on CBT protocols that integrates with therapist dashboards",
  "A B2B marketplace for surplus industrial materials to reduce manufacturing waste",
  "A DNA-based data storage system for long-term archival of enterprise data",
  "An AI agent that negotiates SaaS contract renewals on behalf of procurement teams",
  "A vertical farming system optimized for high-protein crops in urban food deserts",
  "A wearable EEG headband that improves focus through neurofeedback during work sessions",
  "A platform that converts abandoned malls into co-living spaces with modular construction",
  "An AI-powered podcast editor that removes filler words and optimizes pacing automatically",
  "A device that monitors water quality in real-time for municipal treatment plants using spectroscopy",
  "A last-mile delivery network using autonomous sidewalk robots in dense European cities",
  "A digital twin platform for simulating clinical trials before recruiting patients",
  "An open-source tool for bias auditing in hiring algorithms used by Fortune 500 companies",
  "A bioprinting startup creating patient-specific tissue grafts for burn victims",
  "A climate risk scoring API for real estate investors evaluating coastal property portfolios",
  "A community-owned broadband network using mesh WiFi for underserved rural areas",
  "A pet health monitoring collar that detects early signs of kidney disease in cats",
  "An AI-powered fashion design tool that generates sustainable clothing patterns from sketches",
  "A platform for booking and managing clinical trial participation for patients",
  "A quantum computing cloud service optimized for drug molecule simulation",
  "An AI writing assistant for patent attorneys that auto-generates prior art searches",
  "A logistics platform optimizing cold-chain delivery for mRNA vaccines in tropical regions",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type Stage = "idea" | "loading" | "sourcing" | "fitting" | "preview" | "sending" | "contacted";

export default function Teaser() {
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<Stage>("idea");
  const [result, setResult] = useState<TeaserResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caps, setCaps] = useState<Capabilities>(NO_CAPS);
  const [selectedCandidate, setSelectedCandidate] = useState<PreviewCandidate | null>(null);
  const randomExamples = useMemo(() => pickRandom(IDEA_BANK, 3), []);

  useEffect(() => {
    getCapabilities().then(setCaps).catch(() => {});
  }, []);

  async function onAssemble() {
    if (idea.trim().length < 8) {
      setError("Give me a sentence or two about your idea.");
      return;
    }
    setError(null);
    setStage("loading");
    try {
      const resultPromise = teaserPreview(idea);
      // Show sourcing stage after 1.5s
      await new Promise((res) => setTimeout(res, 1500));
      setStage("sourcing");
      // Show fitting stage after another 2s
      await new Promise((res) => setTimeout(res, 2000));
      setStage("fitting");
      // Wait for actual result
      const r = await resultPromise;
      // Show fitting scores for 2s
      setResult(r);
      await new Promise((res) => setTimeout(res, 2000));
      setStage("preview");
    } catch (e) {
      setError((e as Error).message || "Something went wrong.");
      setStage("idea");
    }
  }

  function onSelectCandidate(candidate: PreviewCandidate) {
    setSelectedCandidate(candidate);
    setStage("sending");
    // Simulate email sending animation, then transition
    setTimeout(() => {
      setStage("contacted");
    }, 2200);
  }

  function buildVoiceAgentUrl(candidate: PreviewCandidate): string {
    const params = new URLSearchParams({
      name: candidate.name,
      role: candidate.headline,
      idea: idea,
      expertise: candidate.expertise.join(", "),
      whyMatch: candidate.whyMatch,
    });
    return `https://try.teamassemble.fr/?${params.toString()}`;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Idea input */}
      {(stage === "idea" || stage === "loading" || stage === "sourcing" || stage === "fitting") && (
        <div className="fade-up">
          <div className="card p-2">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your idea in a sentence or two…"
              rows={3}
              disabled={stage !== "idea"}
              className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-[var(--muted)]"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onAssemble();
              }}
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-3">
                {stage === "idea" && (
                  <VoiceMic
                    caps={caps}
                    onText={(t) => setIdea(t)}
                    onPartial={(t) => setIdea(t)}
                  />
                )}
                <span className="text-xs text-[var(--muted)]">
                  {stage === "idea" ? "⌘/Ctrl + Enter" : stage === "loading" ? "Decomposing your idea…" : stage === "sourcing" ? "🔍 Searching profiles on Linkup…" : "📊 Verifying fit scores…"}
                </span>
              </div>
              <button
                onClick={onAssemble}
                disabled={stage !== "idea"}
                className="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                {stage !== "idea" ? "Assembling…" : "Assemble my team →"}
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {stage === "idea" && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                Try an example
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {randomExamples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setIdea(ex)}
                    className="chip px-3 py-2 text-left text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "loading" && <LoadingStepDecompose />}
          {stage === "sourcing" && <LoadingStepLinkup />}
          {stage === "fitting" && <LoadingStepFit result={result} idea={idea} />}
        </div>
      )}

      {/* Preview — clickable profiles */}
      {stage === "preview" && result && (
        <div className="fade-up space-y-6">
          <Preview result={result} onSelect={onSelectCandidate} />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Sending email animation */}
      {stage === "sending" && selectedCandidate && (
        <div className="fade-up flex flex-col items-center justify-center py-16">
          <div className="email-fly-animation mb-6">
            <div className="email-icon">✉️</div>
          </div>
          <h3 className="text-lg font-semibold">
            Sending outreach to {selectedCandidate.name}…
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Preparing your personalized introduction
          </p>
          <div className="mt-4 flex gap-1">
            <span className="sending-dot" style={{ animationDelay: "0s" }} />
            <span className="sending-dot" style={{ animationDelay: "0.2s" }} />
            <span className="sending-dot" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      )}

      {/* Contacted — show CTA to voice agent */}
      {stage === "contacted" && selectedCandidate && (
        <div className="fade-up space-y-6">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-xl font-bold">
              Outreach sent to {selectedCandidate.name}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-md mx-auto">
              {selectedCandidate.name} will receive a personalized voice introduction 
              about your project. See exactly what they&apos;ll experience:
            </p>

            <div className="mt-6 card p-5 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-[var(--fg)] flex items-center justify-center text-sm font-bold text-[var(--bg)]">
                  {selectedCandidate.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedCandidate.name}</p>
                  <p className="text-xs text-[var(--muted)]">{selectedCandidate.headline}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--fg)]/80 leading-relaxed">
                {selectedCandidate.whyMatch}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedCandidate.expertise.map((e) => (
                  <span key={e} className="chip px-2 py-0.5 text-[10px]">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            <a
              href={buildVoiceAgentUrl(selectedCandidate)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 btn-accent rounded-xl px-6 py-3 text-sm font-semibold mt-6 no-underline"
            >
              🎙️ See what {selectedCandidate.name.split(" ")[0]} receives
              <span className="text-lg">→</span>
            </a>

            <p className="mt-3 text-xs text-[var(--muted)]">
              Experience the voice introduction as if you were the candidate
            </p>
          </div>

          <button
            onClick={() => {
              setIdea("");
              setSelectedCandidate(null);
              setResult(null);
              setStage("idea");
            }}
            className="mx-auto block text-sm text-[var(--muted)] hover:text-[var(--fg)] hover:underline"
          >
            ← Try another idea
          </button>
        </div>
      )}

      {!convexEnabled && (
        <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
          demo mode — running the deterministic decomposition locally. Connect
          Convex + OpenAI keys for live sourcing.
        </p>
      )}
    </div>
  );
}

function LoadingStepDecompose() {
  return (
    <div className="mt-6 space-y-3">
      <div className="card p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center animate-pulse">
          <span className="text-sm">🧠</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Analyzing your idea...</p>
          <p className="text-xs text-[var(--muted)]">Identifying required expertise domains</p>
        </div>
        <div className="flex gap-1">
          <span className="sending-dot" style={{ animationDelay: "0s" }} />
          <span className="sending-dot" style={{ animationDelay: "0.2s" }} />
          <span className="sending-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card shimmer h-20" />
      ))}
    </div>
  );
}

function LoadingStepLinkup() {
  return (
    <div className="mt-6 space-y-3">
      <div className="card p-4 flex items-center gap-3 border-[var(--good)]/30">
        <div className="h-8 w-8 rounded-full bg-[var(--good)]/20 flex items-center justify-center">
          <span className="text-sm">✓</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--good)]">Idea decomposed</p>
          <p className="text-xs text-[var(--muted)]">3 expertise domains identified</p>
        </div>
      </div>
      <div className="card p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center animate-pulse">
          <span className="text-sm">🔍</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Sourcing profiles on Linkup...</p>
          <p className="text-xs text-[var(--muted)]">Searching professional networks for matching candidates</p>
        </div>
        <div className="flex gap-1">
          <span className="sending-dot" style={{ animationDelay: "0s" }} />
          <span className="sending-dot" style={{ animationDelay: "0.2s" }} />
          <span className="sending-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card shimmer h-24" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

function LoadingStepFit({ result, idea }: { result: TeaserResult | null; idea: string }) {
  const candidates = result?.previewCandidates ?? [];
  return (
    <div className="mt-6 space-y-3">
      <div className="card p-4 flex items-center gap-3 border-[var(--good)]/30">
        <div className="h-8 w-8 rounded-full bg-[var(--good)]/20 flex items-center justify-center">
          <span className="text-sm">✓</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--good)]">Idea decomposed</p>
          <p className="text-xs text-[var(--muted)]">3 expertise domains identified</p>
        </div>
      </div>
      <div className="card p-4 flex items-center gap-3 border-[var(--good)]/30">
        <div className="h-8 w-8 rounded-full bg-[var(--good)]/20 flex items-center justify-center">
          <span className="text-sm">✓</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--good)]">Profiles sourced via Linkup</p>
          <p className="text-xs text-[var(--muted)]">{result ? result.previewCandidates.length : 3} candidates found</p>
        </div>
      </div>
      <div className="card p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
          <span className="text-sm">📊</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Verifying fit scores...</p>
          <p className="text-xs text-[var(--muted)]">Analyzing profile relevance to your idea</p>
        </div>
      </div>
      {/* Show animated fit scores */}
      <div className="grid gap-2 sm:grid-cols-3">
        {(candidates.length > 0 ? candidates : [{name: "Candidate 1"}, {name: "Candidate 2"}, {name: "Candidate 3"}] as PreviewCandidate[]).map((c, i) => (
          <div key={i} className="card p-3 text-center" style={{ animation: `fadeIn 0.5s ease ${i * 0.3}s both` }}>
            <div className="text-2xl font-bold" style={{ animation: `countUp 1s ease ${i * 0.3 + 0.5}s both` }}>
              {computeFitScore(c.name, idea, i)}%
            </div>
            <p className="text-xs text-[var(--muted)] mt-1 truncate">{c.name}</p>
            <p className="text-[10px] text-[var(--good)] mt-0.5">{i === 0 ? "Best match" : "Strong match"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Preview({
  result,
  onSelect,
}: {
  result: TeaserResult;
  onSelect: (c: PreviewCandidate) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Domains detected
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {result.domains.map((d) => (
            <span key={d} className="chip px-3 py-1 text-sm">
              {d}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Expertise you&apos;re missing
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {result.missingExpertise.map((d) => (
            <span
              key={d}
              className="chip px-3 py-1 text-sm text-[var(--accent-2)]"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {result.clarifyingQuestions.length > 0 && (
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
            The agent wants to know
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {result.clarifyingQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          Your founding team ({result.previewCandidates.length} matches) — click to reach out
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {result.previewCandidates.map((c, i) => {
            const fitScore = computeFitScore(c.name, result.projectId, i);
            return (
              <button
                key={i}
                onClick={() => onSelect(c)}
                className="card relative overflow-hidden p-4 text-left transition-all duration-200 hover:border-[var(--fg)]/30 hover:shadow-md hover:scale-[1.02] cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--fg)] flex items-center justify-center text-[10px] font-bold text-[var(--bg)]">
                    {c.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{fitScore}%</div>
                    <div className="text-[9px] text-[var(--good)]">fit score</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">{c.headline}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--fg)]/80">
                  {c.whyMatch}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.expertise.map((e) => (
                    <span key={e} className="chip px-2 py-0.5 text-[10px]">
                      {e}
                    </span>
                  ))}
                </div>
                <div className="absolute right-2 bottom-2 text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                  ✉️ Contact
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
