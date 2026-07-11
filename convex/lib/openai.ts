// Minimal OpenAI chat helper built on fetch so it runs in Convex's default
// runtime. Returns parsed JSON plus token/cost telemetry for observability.

const PRICING: Record<string, { in: number; out: number }> = {
  // USD per 1M tokens
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1": { in: 2, out: 8 },
};

export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export type LlmCall = {
  content: string;
  json: unknown;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  model: string;
};

export async function chatJson(opts: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
}): Promise<LlmCall> {
  const model = opts.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const started = Date.now();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  let json: unknown = {};
  try {
    json = JSON.parse(content);
  } catch {
    json = {};
  }
  const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const p = PRICING[model] ?? PRICING["gpt-4o-mini"];
  const costUsd =
    (usage.prompt_tokens / 1e6) * p.in + (usage.completion_tokens / 1e6) * p.out;

  return {
    content,
    json,
    tokens: usage.total_tokens,
    costUsd,
    latencyMs: Date.now() - started,
    model,
  };
}
