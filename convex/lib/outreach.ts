// Pure outreach-draft logic: prompt builder + deterministic demo draft.

export type OutreachDraft = { subject: string; body: string };

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

export const OUTREACH_SYSTEM_PROMPT = `You are the Outreach Agent for "Assemble".
Write a SHORT, warm, specific first-touch message from a founder to a potential co-founder/early hire.
Rules:
- 90-140 words, plain language, no corporate fluff, no emojis.
- Reference exactly why THIS person fits (use the provided whyMatch), and the concrete idea.
- End with a low-friction ask (a 15-minute call).
- For LinkedIn: no subject line, slightly more casual, under 110 words.
- For email: include a crisp subject line.
Return strict minified JSON: {"subject": string, "body": string}. For LinkedIn set subject to "".`;

export function buildOutreachUserPrompt(ctx: OutreachContext): string {
  return JSON.stringify({
    channel: ctx.channel,
    sender: ctx.senderName ?? "the founder",
    idea: ctx.ideaText,
    domains: ctx.domains,
    recipient: {
      name: ctx.candidateName,
      headline: ctx.candidateHeadline,
      fillingRole: ctx.personaRole,
      whyMatch: ctx.whyMatch,
    },
  });
}

export function demoDraft(ctx: OutreachContext): OutreachDraft {
  const firstName = ctx.candidateName.split(" ")[0] || "there";
  const idea = ctx.ideaText.length > 120 ? ctx.ideaText.slice(0, 117) + "…" : ctx.ideaText;
  const sender = ctx.senderName ?? "";
  const body =
    `Hi ${firstName},\n\n` +
    `I'm building ${idea} — and I'm looking for a ${ctx.personaRole} to build it with. ` +
    `Your background (${ctx.candidateHeadline}) stood out: ${ctx.whyMatch}\n\n` +
    `I'd love 15 minutes to share where it's at and hear your take — no pitch, just a real conversation. ` +
    `Would this week work?\n\n` +
    (sender ? `Thanks,\n${sender}` : `Thanks!`);
  const subject =
    ctx.channel === "linkedin"
      ? ""
      : `Building in ${ctx.domains[0] ?? "a new space"} — would love your take`;
  return { subject, body };
}

export function coerceDraft(raw: unknown, fallback: OutreachDraft): OutreachDraft {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const body = typeof o.body === "string" && o.body.trim() ? o.body : fallback.body;
  const subject = typeof o.subject === "string" ? o.subject : fallback.subject;
  return { subject, body };
}
