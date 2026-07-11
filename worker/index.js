const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

async function createConversationToken(request, env) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }

  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_AGENT_ID) {
    return json({ error: "ElevenLabs is not configured for this deployment." }, 503);
  }

  const endpoint = new URL("https://api.elevenlabs.io/v1/convai/conversation/token");
  endpoint.searchParams.set("agent_id", env.ELEVENLABS_AGENT_ID);

  const upstream = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "xi-api-key": env.ELEVENLABS_API_KEY
    }
  });

  if (!upstream.ok) {
    console.error("ElevenLabs token request failed", upstream.status);
    return json({ error: "The voice service could not start a session." }, 502);
  }

  const payload = await upstream.json();
  if (!payload.token) {
    return json({ error: "The voice service returned an invalid session." }, 502);
  }

  return json({ conversationToken: payload.token });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/conversation-token") {
      return createConversationToken(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
