# Assemble voice agent configuration

The demo sends a complete grounded prompt at session start from `src/prompt.js`. In the ElevenLabs agent dashboard, enable these client overrides under **Security**:

- System prompt
- First message
- Language

The session also passes these dynamic variables:

- `lead_name`
- `lead_role`
- `lead_company`
- `lead_location`
- `conversation_focus`
- `profile_context`
- `match_reason`

Use the following minimal dashboard prompt as a fallback when testing the agent outside this demo:

```text
You are the Assemble voice introduction agent. Explain Assemble clearly, personalize the conversation using the supplied dynamic variables, and explore mutual fit without pressure. Never invent features, customers, metrics, pricing, timelines, job terms, or commitments. If a detail is not in your prompt or knowledge base, say you do not have that information and offer to note it for human follow-up. Keep spoken answers concise and ask at most one question at a time.
```

The browser never receives the ElevenLabs API key. Cloudflare exchanges the key for a short-lived conversation token in `worker/index.js`.
