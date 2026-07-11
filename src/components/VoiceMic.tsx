"use client";

import { useEffect, useRef, useState } from "react";
import type { Capabilities } from "@/lib/backend";
import { transcribeAudio } from "@/lib/backend";
import {
  browserDictate,
  startRecording,
  supportsBrowserSTT,
  supportsRecording,
} from "@/lib/voice";

type State = "idle" | "listening" | "processing";

// A mic button that fills text via voice. Prefers ElevenLabs Scribe (records
// audio → server) when available for the power-up; otherwise uses the browser
// Web Speech API so it still works offline.
export default function VoiceMic({
  caps,
  onText,
  onPartial,
}: {
  caps: Capabilities;
  onText: (text: string) => void;
  onPartial?: (text: string) => void;
}) {
  const [state, setState] = useState<State>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const stopRef = useRef<null | (() => void)>(null);
  const recRef = useRef<null | { stop: () => Promise<{ base64: string; mime: string }> }>(null);

  // Browser-capability detection must run only after mount, otherwise SSR
  // (no window) and the client disagree and hydration fails.
  const useEleven = mounted && caps.elevenlabsStt && supportsRecording();
  const useBrowser = mounted && !useEleven && supportsBrowserSTT();
  const available = useEleven || useBrowser;

  useEffect(() => setMounted(true), []);
  useEffect(() => () => stopRef.current?.(), []);

  async function start() {
    setErr(null);
    if (useEleven) {
      try {
        recRef.current = await startRecording();
        setState("listening");
      } catch {
        setErr("Mic permission denied.");
      }
    } else if (useBrowser) {
      stopRef.current = browserDictate({
        onPartial,
        onFinal: (t) => onText(t),
        onEnd: () => setState("idle"),
        onError: (m) => {
          setErr(m);
          setState("idle");
        },
      });
      setState("listening");
    }
  }

  async function stop() {
    if (useEleven && recRef.current) {
      setState("processing");
      try {
        const { base64, mime } = await recRef.current.stop();
        const r = await transcribeAudio(base64, mime);
        if (r.ok && r.text) onText(r.text);
        else setErr("Could not transcribe — try again.");
      } catch {
        setErr("Transcription failed.");
      } finally {
        recRef.current = null;
        setState("idle");
      }
    } else if (useBrowser) {
      stopRef.current?.();
      stopRef.current = null;
      setState("idle");
    }
  }

  if (!available) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={state === "listening" ? stop : state === "idle" ? start : undefined}
        disabled={state === "processing"}
        title={useEleven ? "Speak your idea (ElevenLabs)" : "Speak your idea"}
        aria-label="Dictate idea"
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          state === "listening"
            ? "border-red-500 bg-red-500/15 text-red-400"
            : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
        }`}
      >
        {state === "processing" ? (
          <span className="text-xs">…</span>
        ) : state === "listening" ? (
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        ) : (
          <MicIcon />
        )}
      </button>
      {state === "listening" && (
        <span className="text-xs text-[var(--muted)]">
          listening… tap to stop
        </span>
      )}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
