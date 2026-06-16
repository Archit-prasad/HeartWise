import type { ChatMode } from "@/lib/mode-token";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  kind?: "guardrail";
}

const STORAGE_KEY = "heartwise-chat-history";
const MODE_KEY = "heartwise-current-mode";

export const DEFAULT_GREETING: ChatMessage = {
  id: "greeting",
  sender: "ai",
  text:
    "Hi there. I'm HeartWise. Tell me what's on your mind or what you're going through, and let's figure it out together.",
};

export function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [DEFAULT_GREETING];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [DEFAULT_GREETING];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [DEFAULT_GREETING];
  } catch {
    return [DEFAULT_GREETING];
  }
}

export function saveMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function clearMessages() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(MODE_KEY);
}

export function loadMode(): ChatMode | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MODE_KEY) as ChatMode | null;
}

export function saveMode(mode: ChatMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_KEY, mode);
}

export function hasExistingConversation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.some((m: ChatMessage) => m.sender === "user");
  } catch {
    return false;
  }
}
