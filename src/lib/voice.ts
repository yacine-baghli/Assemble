// Browser-side voice primitives with graceful fallbacks.
// STT: MediaRecorder (→ ElevenLabs Scribe) or the Web Speech API (offline).
// TTS: ElevenLabs audio or the browser SpeechSynthesis (offline).

import { synthesizeSpeech, type Capabilities } from "@/lib/backend";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

export function supportsBrowserSTT(): boolean {
  if (typeof window === "undefined") return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function supportsBrowserTTS(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function supportsRecording(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

// Live dictation via the Web Speech API. Returns a stop() function.
export function browserDictate(handlers: {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onEnd?: () => void;
  onError?: (msg: string) => void;
}): () => void {
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const rec: SR = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = true;
  let finalText = "";

  rec.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const chunk = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += chunk + " ";
      else interim += chunk;
    }
    handlers.onPartial?.((finalText + interim).trim());
  };
  rec.onerror = (e: any) => handlers.onError?.(e.error ?? "speech error");
  rec.onend = () => {
    if (finalText.trim()) handlers.onFinal(finalText.trim());
    handlers.onEnd?.();
  };
  rec.start();
  return () => rec.stop();
}

// Record mic audio; resolve base64 + mime when stopped.
export async function startRecording(): Promise<{
  stop: () => Promise<{ base64: string; mime: string }>;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm")
    ? "audio/webm"
    : "audio/mp4";
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  recorder.start();

  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: mime });
          const base64 = await blobToBase64(blob);
          resolve({ base64, mime });
        };
        recorder.stop();
      }),
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1)); // strip data: prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Speak text: ElevenLabs if available, else the browser voice.
export async function speak(text: string, caps: Capabilities): Promise<void> {
  if (caps.elevenlabsTts) {
    try {
      const r = await synthesizeSpeech(text);
      if (r.ok && r.audioBase64) {
        const audio = new Audio(`data:${r.mime};base64,${r.audioBase64}`);
        await audio.play();
        return;
      }
    } catch {
      // fall through to browser TTS
    }
  }
  if (supportsBrowserTTS()) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

export function stopSpeaking(): void {
  if (supportsBrowserTTS()) window.speechSynthesis.cancel();
}
