"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Compass,
  Heart,
  HeartCrack,
  Loader2,
  LogOut,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type ChatMessage,
  DEFAULT_GREETING,
  loadMessages,
  loadMode,
  saveMessages,
  saveMode,
} from "@/lib/chat-storage";
import { extractMode, finalizeMode, type ChatMode } from "@/lib/mode-token";
import { FloatingBackground } from "@/components/FloatingBackground";

const ANALYZING = "Analyzing..." as const;
type DisplayMode = ChatMode | typeof ANALYZING;

const MODE_CONFIG: Record<DisplayMode, { icon: typeof Heart; classes: string; spin?: boolean }> = {
  [ANALYZING]: {
    icon: Loader2,
    classes: "border-white/10 bg-white/5 text-slate-300",
    spin: true,
  },
  "Wooing them": {
    icon: Heart,
    classes: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  },
  "Breaking up": {
    icon: HeartCrack,
    classes: "border-slate-400/30 bg-slate-500/10 text-slate-300",
  },
  "Solving complexity": {
    icon: Compass,
    classes: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  },
};

function ModeBadge({ mode }: { mode: DisplayMode }) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md ${config.classes}`}
    >
      <Icon className={`h-3.5 w-3.5 ${config.spin ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{mode}</span>
    </span>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_GREETING]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<DisplayMode>(ANALYZING);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // localStorage is unavailable during SSR, so history/mode are synced after
    // mount to keep the prerendered HTML and client's first render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(loadMessages());
    const savedMode = loadMode();
    if (savedMode) setChatMode(savedMode);
  }, []);

  useEffect(() => {
    saveMessages(messages);
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue("");
    const history = messages;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const aiId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: aiId, sender: "ai", text: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Request failed");
      }

      const isGuardrail = response.headers.get("X-Heartwise-Guardrail") === "1";

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        if (isGuardrail) {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, text: accumulated } : m))
          );
          continue;
        }

        const { mode, displayText } = extractMode(accumulated);
        if (mode) {
          setChatMode(mode);
          saveMode(mode);
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, text: displayText } : m))
        );
      }

      if (isGuardrail) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, kind: "guardrail" } : m))
        );
      } else {
        const final = finalizeMode(accumulated);
        if (final.mode) {
          setChatMode(final.mode);
          saveMode(final.mode);
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? {
                  ...m,
                  text: final.displayText || "I'm having trouble responding right now.",
                }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? {
                ...m,
                text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = () => {
    router.push("/summary");
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950">
      <FloatingBackground />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <span className="hidden font-medium sm:inline">HeartWise</span>
          </Link>
          <ModeBadge mode={chatMode} />
        </div>

        <button
          onClick={handleEndSession}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">End Session</span>
        </button>
      </header>

      {/* Message Area */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-6 pb-32 sm:px-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
                msg.kind === "guardrail"
                  ? "self-start rounded-bl-sm border border-amber-400/30 bg-amber-500/10 text-amber-200 backdrop-blur-md"
                  : msg.sender === "user"
                    ? "self-end rounded-br-sm bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20"
                    : "self-start rounded-bl-sm border border-white/10 bg-white/5 text-slate-200 backdrop-blur-md"
              }`}
            >
              {msg.kind === "guardrail" && (
                <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Off-topic
                </span>
              )}
              {msg.text || (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </main>

      {/* Fixed Input Bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Share what's happening in your relationship..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
