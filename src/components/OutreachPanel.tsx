"use client";

import { useCallback, useEffect, useState } from "react";
import {
  draftOutreach,
  sendOutreachEmail,
  type Candidate,
  type Capabilities,
} from "@/lib/backend";

type Channel = "email" | "linkedin";

// Human-in-the-loop outreach: draft → edit → approve → send/copy.
// Nothing is sent without an explicit approval click.
export default function OutreachPanel({
  candidate,
  ideaText,
  domains,
  caps,
  onClose,
}: {
  candidate: Candidate;
  ideaText: string;
  domains: string[];
  caps: Capabilities;
  onClose: () => void;
}) {
  const [channel, setChannel] = useState<Channel>("email");
  const [senderName, setSenderName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const linkedinUrl = candidate.profileUrls.find((u) => /linkedin/i.test(u)) ?? candidate.profileUrls[0];

  const regenerate = useCallback(
    async (ch: Channel) => {
      setLoading(true);
      setError(null);
      try {
        const d = await draftOutreach({
          candidateName: candidate.name,
          candidateHeadline: candidate.headline,
          whyMatch: candidate.whyMatch,
          personaRole: candidate.personaRole,
          ideaText,
          domains,
          senderName: senderName || undefined,
          channel: ch,
        });
        setSubject(d.subject);
        setBody(d.body);
        setDemoMode(d.demoMode);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [candidate, ideaText, domains, senderName],
  );

  useEffect(() => {
    regenerate("email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchChannel(ch: Channel) {
    if (ch === channel) return;
    setChannel(ch);
    setSent(false);
    regenerate(ch);
  }

  async function copy() {
    const text = channel === "email" && subject ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function approveAndSend() {
    setError(null);
    setSending(true);
    try {
      const r = await sendOutreachEmail({ toEmail, subject, body, fromName: senderName });
      if (r.ok) setSent(true);
      else setError(r.reason ?? "Send failed");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card fade-up w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Outreach to {candidate.name}</h3>
            <p className="text-xs text-[var(--muted)]">
              {candidate.headline} · {candidate.personaRole}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--fg)]">
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-1.5">
          {(["email", "linkedin"] as Channel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => switchChannel(ch)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                channel === ch
                  ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white"
                  : "chip text-[var(--muted)]"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {sent ? (
          <div className="mt-6 text-center">
            <div className="text-3xl">📨</div>
            <p className="mt-2 font-semibold">Sent to {toEmail}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              A real email was delivered via Resend.
            </p>
            <button onClick={onClose} className="btn-accent mt-4 rounded-xl px-5 py-2 text-sm font-semibold">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-2">
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name (for the signature)"
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              {channel === "email" && (
                <>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="Recipient email (we never invent one)"
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </>
              )}
              <textarea
                value={loading ? "Drafting a personalized message…" : body}
                onChange={(e) => setBody(e.target.value)}
                disabled={loading}
                rows={9}
                className="resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
              />
            </div>

            {demoMode && (
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                draft written by template — add OpenAI for a tailored draft
              </p>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <button onClick={() => regenerate(channel)} className="text-[var(--accent-2)] hover:underline">
                  ↻ regenerate
                </button>
                {channel === "linkedin" && linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-2)] hover:underline">
                    open profile ↗
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={copy} className="chip rounded-xl px-4 py-2 text-sm">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                {channel === "email" &&
                  (caps.resend ? (
                    <button
                      onClick={approveAndSend}
                      disabled={sending || loading || !toEmail}
                      className="btn-accent rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      {sending ? "Sending…" : "Approve & send"}
                    </button>
                  ) : (
                    <span className="chip rounded-xl px-4 py-2 text-xs text-[var(--muted)]">
                      add Resend key to send
                    </span>
                  ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--muted)]">
              You approve before anything is sent. LinkedIn = copy &amp; send manually
              (no automation).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
