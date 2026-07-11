# Assemble voice agent configuration

The demo sends a complete grounded prompt at session start from `src/prompt.js`. In the ElevenLabs agent dashboard, enable these client overrides under **Security**:

- System prompt
- First message
- Language

The session also passes these dynamic variables:

- `requester_name`
- `opportunity_role`
- `lead_name`
- `lead_role`
- `lead_company`
- `lead_location`
- `conversation_focus`
- `profile_context`

Use the following minimal dashboard prompt as a fallback when testing the agent outside this demo:

```text
You are Abdelmouhaimen's Assemble voice introduction agent. Explain that he is looking for a cofounder and that the person's professional profile appears relevant. Use the supplied profile details to keep the conversation relevant without pretending they are independently verified. Never imply selection or guarantee a role. Never invent features, customers, metrics, pricing, timelines, job terms, or commitments. If a detail is not in your prompt or knowledge base, say you do not have that information and offer to note it for human follow-up. Keep spoken answers concise and ask at most one question at a time.
```

The browser never receives the ElevenLabs API key. Cloudflare exchanges the key for a short-lived conversation token in `worker/index.js`.
