import { Conversation } from "@elevenlabs/client";
import {
  ArrowRight,
  Mic,
  MicOff,
  Pencil,
  PhoneOff,
  RotateCcw,
  ShieldCheck,
  createIcons
} from "lucide";
import { buildFirstMessage, buildSystemPrompt, getDynamicVariables } from "./prompt.js";
import "./styles.css";

createIcons({
  icons: { ArrowRight, Mic, MicOff, Pencil, PhoneOff, RotateCcw, ShieldCheck },
  attrs: { "stroke-width": 1.8 }
});

const elements = {
  onboardingScreen: document.getElementById("onboarding-screen"),
  conversationScreen: document.getElementById("conversation-screen"),
  form: document.getElementById("profile-form"),
  preparedFor: document.getElementById("prepared-for-preview"),
  editProfile: document.getElementById("edit-profile"),
  startCall: document.getElementById("start-call"),
  muteCall: document.getElementById("mute-call"),
  endCall: document.getElementById("end-call"),
  clearTranscript: document.getElementById("clear-transcript"),
  transcript: document.getElementById("transcript"),
  voiceStage: document.getElementById("voice-stage"),
  voiceVisual: document.getElementById("voice-visual"),
  statusTitle: document.getElementById("status-title"),
  statusDetail: document.getElementById("status-detail"),
  connectionLabel: document.getElementById("connection-label"),
  error: document.getElementById("error-message"),
  timer: document.getElementById("call-timer")
};

let profile = null;
let conversation = null;
let isMuted = false;
let timerStartedAt = 0;
let timerInterval = null;
let visualFrame = null;

function clean(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function readProfile() {
  const data = new FormData(elements.form);
  return {
    name: clean(data.get("name"), 80),
    role: clean(data.get("role"), 100),
    company: clean(data.get("company"), 100),
    location: clean(data.get("location"), 100),
    focus: clean(data.get("focus"), 160),
    profileContext: clean(data.get("profileContext"), 600)
  };
}

function initials(name) {
  const parts = name.split(" ").filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]).join("").toUpperCase() || "A";
}

function setText(id, value) {
  const target = document.getElementById(id);
  if (target) target.textContent = value;
}

function showScreen(name) {
  const showConversation = name === "conversation";
  elements.onboardingScreen.hidden = showConversation;
  elements.conversationScreen.hidden = !showConversation;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProfileSummary() {
  setText("profile-initials", initials(profile.name));
  setText("summary-name", profile.name);
  setText("summary-role", [profile.role, profile.company].filter(Boolean).join(" at "));
  setText("summary-focus", profile.focus);
}

function setCallState(state, title, detail) {
  elements.voiceStage.dataset.callState = state;
  elements.statusTitle.textContent = title;
  elements.statusDetail.textContent = detail;
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = !message;
}

function setControls(active) {
  elements.startCall.disabled = active;
  elements.startCall.hidden = active;
  elements.muteCall.disabled = !active;
  elements.endCall.disabled = !active;
}

function addTranscript(role, message) {
  const empty = elements.transcript.querySelector(".transcript-empty");
  if (empty) empty.remove();

  const item = document.createElement("article");
  item.className = `transcript-message transcript-${role}`;

  const label = document.createElement("span");
  label.textContent = role === "agent" ? "Assemble" : profile.name;

  const text = document.createElement("p");
  text.textContent = message;

  item.append(label, text);
  elements.transcript.append(item);
  elements.transcript.scrollTop = elements.transcript.scrollHeight;
}

function resetTranscript() {
  elements.transcript.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "transcript-empty";
  empty.textContent = "The transcript will appear here once the conversation begins.";
  elements.transcript.append(empty);
}

function startTimer() {
  stopTimer();
  timerStartedAt = Date.now();
  timerInterval = window.setInterval(() => {
    const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    elements.timer.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
}

function animateVoiceLevel() {
  if (!conversation) return;
  const level = elements.voiceStage.dataset.mode === "speaking"
    ? conversation.getOutputVolume()
    : conversation.getInputVolume();
  const normalized = Math.min(1, Math.max(0.08, level * 3.5));
  elements.voiceVisual.style.setProperty("--voice-level", normalized.toFixed(3));
  visualFrame = window.requestAnimationFrame(animateVoiceLevel);
}

function stopVoiceAnimation() {
  if (visualFrame) window.cancelAnimationFrame(visualFrame);
  visualFrame = null;
  elements.voiceVisual.style.setProperty("--voice-level", "0.08");
}

async function requestConversationToken() {
  const response = await fetch("/api/conversation-token", {
    method: "POST",
    headers: { Accept: "application/json" }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.conversationToken) {
    throw new Error(payload.error || "The voice service is not available right now.");
  }
  return payload.conversationToken;
}

async function startConversation() {
  showError("");
  setCallState("connecting", "Connecting", "Preparing the voice session...");
  elements.connectionLabel.textContent = "Connecting";
  elements.startCall.disabled = true;

  try {
    const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    permissionStream.getTracks().forEach((track) => track.stop());

    const conversationToken = await requestConversationToken();
    conversation = await Conversation.startSession({
      conversationToken,
      connectionType: "webrtc",
      dynamicVariables: getDynamicVariables(profile),
      overrides: {
        agent: {
          prompt: { prompt: buildSystemPrompt(profile) },
          firstMessage: buildFirstMessage(profile),
          language: "en"
        }
      },
      onConnect: () => {
        setControls(true);
        setCallState("connected", "Listening", "Speak naturally. You can interrupt or ask a follow-up at any time.");
        elements.connectionLabel.textContent = "Connected";
        startTimer();
      },
      onDisconnect: () => finishConversation("Conversation ended", "You can restart when you are ready."),
      onModeChange: ({ mode }) => {
        elements.voiceStage.dataset.mode = mode;
        if (mode === "speaking") {
          setCallState("connected", "Assemble is speaking", "You can interrupt at any time.");
        } else {
          setCallState("connected", "Listening", "Go ahead. The agent is listening.");
        }
      },
      onMessage: ({ message, role }) => {
        if (message) addTranscript(role, message);
      },
      onError: (message) => showError(message || "The conversation encountered an error.")
    });

    animateVoiceLevel();
  } catch (error) {
    conversation = null;
    setControls(false);
    elements.startCall.hidden = false;
    elements.startCall.disabled = false;
    setCallState("ready", "Unable to start", "Check the configuration and try again.");
    elements.connectionLabel.textContent = "Not connected";
    const denied = error?.name === "NotAllowedError";
    showError(denied ? "Microphone access is required for the voice conversation." : error.message);
  }
}

function finishConversation(title, detail) {
  conversation = null;
  stopTimer();
  stopVoiceAnimation();
  setControls(false);
  elements.startCall.hidden = false;
  elements.startCall.disabled = false;
  elements.muteCall.dataset.muted = "false";
  elements.muteCall.setAttribute("aria-label", "Mute microphone");
  elements.muteCall.title = "Mute microphone";
  isMuted = false;
  setCallState("ended", title, detail);
  elements.connectionLabel.textContent = "Disconnected";
}

async function endConversation() {
  const activeConversation = conversation;
  if (!activeConversation) return;
  elements.endCall.disabled = true;
  await activeConversation.endSession();
  if (conversation === activeConversation) {
    finishConversation("Conversation ended", "You can restart when you are ready.");
  }
}

function toggleMute() {
  if (!conversation) return;
  isMuted = !isMuted;
  conversation.setMicMuted(isMuted);
  elements.muteCall.dataset.muted = String(isMuted);
  elements.muteCall.setAttribute("aria-label", isMuted ? "Unmute microphone" : "Mute microphone");
  elements.muteCall.title = isMuted ? "Unmute microphone" : "Mute microphone";
  setCallState("connected", isMuted ? "Microphone muted" : "Listening", isMuted ? "Unmute when you are ready to continue." : "Go ahead. The agent is listening.");
}

elements.form.addEventListener("input", () => {
  const name = clean(new FormData(elements.form).get("name"), 80);
  elements.preparedFor.textContent = name || "Your profile";
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;
  profile = readProfile();
  updateProfileSummary();
  showError("");
  showScreen("conversation");
});

elements.editProfile.addEventListener("click", async () => {
  if (conversation) await endConversation();
  showScreen("onboarding");
});

elements.startCall.addEventListener("click", startConversation);
elements.endCall.addEventListener("click", endConversation);
elements.muteCall.addEventListener("click", toggleMute);
elements.clearTranscript.addEventListener("click", resetTranscript);

window.addEventListener("beforeunload", () => {
  if (conversation) conversation.endSession();
});

// ── Auto-fill from URL query params ──────────────────────────────────
(function autoFillFromParams() {
  const params = new URLSearchParams(window.location.search);
  const nameVal = params.get("name");
  const roleVal = params.get("role");
  const ideaVal = params.get("idea");
  const expertiseVal = params.get("expertise");
  const whyMatchVal = params.get("whyMatch");

  // Store idea globally so prompt.js can access it
  if (ideaVal) window.__assembleIdea = ideaVal;

  // Fill form fields
  if (nameVal) {
    document.getElementById("name").value = nameVal;
    elements.preparedFor.textContent = nameVal;
  }
  if (roleVal) document.getElementById("role").value = roleVal;

  // Build profile context from expertise + whyMatch
  const contextParts = [];
  if (expertiseVal) contextParts.push(`Expertise: ${expertiseVal}`);
  if (whyMatchVal) contextParts.push(`Why this person matches: ${whyMatchVal}`);
  if (contextParts.length > 0) {
    document.getElementById("profile-context").value = contextParts.join("\n");
  }

  // Auto-select the first focus option
  const focusSelect = document.getElementById("focus");
  if (focusSelect && focusSelect.options.length > 1) {
    focusSelect.selectedIndex = 1;
  }

  // Update onboarding copy if idea is provided
  if (ideaVal) {
    const lede = document.querySelector(".lede");
    if (lede) {
      lede.textContent = `You've been identified as a potential match for this project: "${ideaVal}". Confirm the details below and start a voice conversation to learn more.`;
    }
    const opportunity = document.querySelector(".conversation-brief dd");
    if (opportunity) {
      opportunity.textContent = `Join the team for: ${ideaVal.slice(0, 80)}${ideaVal.length > 80 ? "…" : ""}`;
    }
  }

  // Auto-check consent and submit if we have all required fields
  if (nameVal && roleVal) {
    const consent = document.getElementById("voice-consent");
    if (consent) consent.checked = true;
  }
})();
