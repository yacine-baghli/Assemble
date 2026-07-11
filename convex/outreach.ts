"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import {
  buildOutreachUserPrompt,
  coerceDraft,
  demoDraft,
  OUTREACH_SYSTEM_PROMPT,
  type OutreachContext,
} from "./lib/outreach";
import { chatJson, hasOpenAI } from "./lib/openai";

const ctxValidator = v.object({
  candidateName: v.string(),
  candidateHeadline: v.string(),
  whyMatch: v.string(),
  personaRole: v.string(),
  ideaText: v.string(),
  domains: v.array(v.string()),
  senderName: v.optional(v.string()),
  channel: v.union(v.literal("email"), v.literal("linkedin")),
});

// Draft a personalized outreach message. Never sends — drafting only.
export const draft = action({
  args: { context: ctxValidator },
  handler: async (_ctx, args) => {
    const context = args.context as OutreachContext;
    const fallback = demoDraft(context);
    if (!hasOpenAI()) return { ...fallback, demoMode: true };
    try {
      const call = await chatJson({
        system: OUTREACH_SYSTEM_PROMPT,
        user: buildOutreachUserPrompt(context),
        temperature: 0.6,
      });
      return { ...coerceDraft(call.json, fallback), demoMode: false };
    } catch {
      return { ...fallback, demoMode: true };
    }
  },
});

// Send an approved email via Resend. Only called after explicit human approval.
export const sendEmail = action({
  args: {
    toEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    fromName: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { ok: false, reason: "no_resend_key" };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(args.toEmail)) {
      return { ok: false, reason: "invalid_email" };
    }
    const resend = new Resend(key);
    const from =
      process.env.RESEND_FROM ?? "Assemble <onboarding@resend.dev>";
    const { data, error } = await resend.emails.send({
      from,
      to: args.toEmail,
      subject: args.subject || "A quick note",
      text: args.body,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: data?.id };
  },
});
