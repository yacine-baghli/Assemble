# Assemble voice agent demo

A voice demo for people exploring Assemble. The visitor shares their profile context, explains what they could bring to the project, chooses a conversation focus, and speaks with an ElevenLabs agent grounded in Assemble's product facts.

## Requirements

- Node.js 20 or newer
- Cloudflare account
- ElevenLabs account with an ElevenLabs Agent

## ElevenLabs setup

1. Create an ElevenLabs Agent and enable authentication.
2. In the agent's **Security** settings, enable client overrides for **System prompt**, **First message**, and **Language**.
3. Review `SYSTEM_PROMPT.md` and configure the listed dynamic variables if you also want to use them in the dashboard prompt.
4. Keep the agent's enabled client events for transcripts and mode changes on if you want the live transcript and speaking/listening state.

## Local development

Create `.dev.vars` from `.dev.vars.example` and set your values:

```text
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=agent_...
```

Run the complete Worker locally:

```bash
npm install
npm run dev:worker
```

For UI-only development with Vite:

```bash
npm run dev
```

## Cloudflare deployment

Store both values as encrypted Worker secrets:

```bash
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put ELEVENLABS_AGENT_ID
npm run deploy
```

The Worker serves the Vite build from `dist/` and handles only `/api/conversation-token`. The API key is never shipped to the browser.

## Production considerations

- Add Cloudflare rate limiting or Turnstile before sharing the demo publicly.
- Configure the ElevenLabs agent allowlist for the final hostname.
- Review ElevenLabs conversation retention and disclosure settings for your jurisdiction.
- Do not place private LinkedIn profile data in query parameters or source files.
