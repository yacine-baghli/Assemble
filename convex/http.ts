import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// Dodo Payments webhook. On a successful payment, reveal the best-fit for the
// project carried in the checkout metadata.
//
// NOTE: Dodo signs webhooks with the Standard Webhooks scheme. For production,
// verify the signature with the `standardwebhooks` library using
// DODO_WEBHOOK_SECRET. We do a presence check here and keep the handler
// idempotent (revealBestFit only un-gates).
http.route({
  path: "/dodo-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (secret && !request.headers.get("webhook-signature")) {
      return new Response("missing signature", { status: 401 });
    }
    let event: {
      type?: string;
      data?: { metadata?: { projectId?: string }; total_amount?: number };
    };
    try {
      event = await request.json();
    } catch {
      return new Response("bad json", { status: 400 });
    }

    const isSuccess =
      event.type?.includes("succeeded") || event.type?.includes("completed");
    const projectId = event.data?.metadata?.projectId;
    if (isSuccess && projectId) {
      const pid = projectId as Id<"projects">;
      await ctx.runMutation(internal.pipeline.revealBestFit, { projectId: pid });
      await ctx.runMutation(internal.pipeline.recordPayment, {
        projectId: pid,
        amount: event.data?.total_amount ?? 0,
        status: "succeeded",
      });
    }
    return new Response("ok", { status: 200 });
  }),
});

export default http;
