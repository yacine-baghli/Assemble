"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const ELEVEN_BASE = "https://api.elevenlabs.io/v1";
// Rachel — a stable default ElevenLabs voice.
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

// Speech-to-text via ElevenLabs Scribe. Client sends base64 audio.
export const transcribe = action({
  args: { audioBase64: v.string(), mimeType: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return { text: "", ok: false, reason: "no_key" };

    const bytes = Buffer.from(args.audioBase64, "base64");
    const blob = new Blob([bytes], { type: args.mimeType ?? "audio/webm" });
    const form = new FormData();
    form.append("file", blob, "idea.webm");
    form.append("model_id", "scribe_v1");

    const res = await fetch(`${ELEVEN_BASE}/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
    });
    if (!res.ok) {
      return { text: "", ok: false, reason: `stt_${res.status}` };
    }
    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "", ok: true };
  },
});

// Text-to-speech via ElevenLabs. Returns base64 mp3 for the client to play.
export const speak = action({
  args: { text: v.string(), voiceId: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return { audioBase64: "", mime: "audio/mpeg", ok: false };

    const voice = args.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE;
    const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: args.text.slice(0, 2500),
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.4, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) return { audioBase64: "", mime: "audio/mpeg", ok: false };
    const buf = Buffer.from(await res.arrayBuffer());
    return { audioBase64: buf.toString("base64"), mime: "audio/mpeg", ok: true };
  },
});
