import { query } from "./_generated/server";

// Which live capabilities are configured (drives client fallbacks).
export const capabilities = query({
  args: {},
  handler: async () => {
    return {
      openai: !!process.env.OPENAI_API_KEY,
      linkup: !!process.env.LINKUP_API_KEY,
      elevenlabsStt: !!process.env.ELEVENLABS_API_KEY,
      elevenlabsTts: !!process.env.ELEVENLABS_API_KEY,
      resend: !!process.env.RESEND_API_KEY,
      dodo: !!process.env.DODO_PAYMENTS_API_KEY,
    };
  },
});
