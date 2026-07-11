"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

function dodoBase(): string {
  return process.env.DODO_MODE === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

// Create a Dodo checkout session to unlock the #1 best-fit co-founder.
// Returns { url: null } when Dodo isn't configured (client falls back to a
// clearly-labeled simulated unlock).
export const createCheckout = action({
  args: { projectId: v.id("projects"), returnUrl: v.string() },
  handler: async (_ctx, args) => {
    const key = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PRODUCT_ID;
    if (!key || !productId) return { url: null as string | null, reason: "not_configured" };

    try {
      const res = await fetch(`${dodoBase()}/checkouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          return_url: args.returnUrl,
          metadata: { projectId: args.projectId },
        }),
      });
      if (!res.ok) {
        return { url: null as string | null, reason: `dodo_${res.status}` };
      }
      const data = (await res.json()) as {
        checkout_url?: string;
        url?: string;
        payment_link?: string;
      };
      return { url: data.checkout_url ?? data.url ?? data.payment_link ?? null };
    } catch (e) {
      return { url: null as string | null, reason: (e as Error).message };
    }
  },
});

// Reveal the best-fit. In production the reveal happens only from the verified
// Dodo webhook (see http.ts); this action backs the post-redirect confirmation
// and the demo (no-Dodo) simulated unlock.
export const unlock = action({
  args: { projectId: v.id("projects"), simulated: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.pipeline.revealBestFit, {
      projectId: args.projectId,
    });
    await ctx.runMutation(internal.pipeline.recordPayment, {
      projectId: args.projectId,
      amount: 0,
      status: args.simulated ? "simulated" : "succeeded",
    });
    return { ok: true };
  },
});
