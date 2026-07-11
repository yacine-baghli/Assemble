# Assemble

Turn an idea into a **founding team**. Assemble decomposes an idea into the
expertise you're missing, finds real people on the public web, explains every
match, drafts validated outreach, and plans the first 30 days.

Built for the **Hermes Buildathon** (track: *AI as Agency*).

## Stack

- **Next.js 15 (App Router) + TypeScript** — thin frontend
- **Convex** — backend, DB, realtime, agent orchestration (actions), observability
- **Linkup** — real people search (structured)
- **OpenAI** — strategy decomposition, ranking, drafting
- **ElevenLabs** — voice (STT + TTS)
- **Resend** — real outreach email (human-approved)
- **Dodo Payments** — unlock the #1 best-fit
- **Cloudflare Workers** via **OpenNext** — deploy

### Architecture note (why Cloudflare is painless)

All heavy logic (OpenAI, Linkup, ElevenLabs, Resend, Dodo webhooks) lives in
**Convex actions**, not in Next server routes. The Cloudflare Worker only serves
the Next frontend + thin routes that talk to Convex over the network. This keeps
the Worker under its size limit and avoids Node-runtime compat pain — while still
earning the Cloudflare power-up (live URL + dashboard).

## Run it locally

The app runs in **two modes**, chosen automatically from `NEXT_PUBLIC_CONVEX_URL`:

- **unset → demo mode:** deterministic decomposition offline; leads saved to
  `.dev-data/leads.json`.
- **set → full mode:** Convex action → OpenAI (if key set); leads in the Convex
  `users` table.

### Demo mode (zero accounts — works right now)

```bash
npm install
npm run dev          # http://localhost:3000
```

Type an idea → see the decomposition + 3 blurred candidate cards → leave an
email. Captured leads land in `.dev-data/leads.json` (inspect via
`GET /api/demo/lead`).

### Full mode (graded demo)

```bash
npx convex dev       # one-time browser login; writes NEXT_PUBLIC_CONVEX_URL to .env.local
```

Set the heavy secrets on Convex (they run the actions):

```bash
npx convex env set OPENAI_API_KEY sk-...
npx convex env set LINKUP_API_KEY ...
npx convex env set ELEVENLABS_API_KEY ...
npx convex env set RESEND_API_KEY ...
npx convex env set DODO_PAYMENTS_API_KEY ...
npx convex env set DODO_WEBHOOK_SECRET ...
```

Optional Convex env vars:

```bash
npx convex env set OPENAI_MODEL gpt-4o-mini        # default
npx convex env set ELEVENLABS_VOICE_ID <voice_id>  # default: Rachel
npx convex env set RESEND_FROM "Assemble <you@yourdomain>"
npx convex env set DODO_MODE test                  # test | live
npx convex env set DODO_PRODUCT_ID <product_id>    # required for real checkout
```

**Dodo webhook** (production reveal path): point your Dodo webhook to
`<your-convex-url>/dodo-webhook` (Convex serves `convex/http.ts`). The best-fit
is revealed on the verified `succeeded` event.

Then `npm run dev` — the app now uses live Convex + OpenAI.

### What works without which key

| Feature | No keys (demo) | With key |
|---|---|---|
| Idea → team decomposition | deterministic | OpenAI (`OPENAI_API_KEY`) |
| People sourcing | honest search links | Linkup (`LINKUP_API_KEY`) |
| Voice in/out | browser Web Speech | ElevenLabs (`ELEVENLABS_API_KEY`) |
| Outreach send | copy only | Resend (`RESEND_API_KEY`) |
| Unlock best-fit | simulated | Dodo (`DODO_PAYMENTS_API_KEY` + `DODO_PRODUCT_ID`) |
| `/runs` observability | needs Convex | Convex |

## Deploy to Cloudflare

Prereqs: `npx wrangler login` (browser). On Windows, run the deploy from **WSL**
(OpenNext/Wrangler are most reliable on Linux); the repo lives at
`/mnt/c/Yacine/.../assemble` from WSL.

```bash
# build-time public vars (baked into the Worker):
#   NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_PLAUSIBLE_DOMAIN
npm run deploy       # opennextjs-cloudflare build && deploy
```

Or connect the GitHub repo to **Cloudflare Workers Builds** (build:
`npx @opennextjs/cloudflare build`, deploy: `npx @opennextjs/cloudflare deploy`)
so every `git push` deploys.

## Observability

Every agent call writes an `agent_steps` row (agent, input, output, tokens, cost,
latency, parent). See `/runs` for the run tree.

## Hermes eligibility

At least one isolated module is built via a **Hermes session** with receipts kept
(see `ASSEMBLE_BUILD_SPEC.md` → *Hermes*). Recommended module: the Execution
Agent or the `/runs` dashboard — both off the live-demo critical path.
