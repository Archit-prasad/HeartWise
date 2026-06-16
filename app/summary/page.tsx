"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Heart,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { clearMessages, loadMessages, type ChatMessage } from "@/lib/chat-storage";

interface SummaryData {
  journey: string;
  insights: string[];
  actionItems: string[];
  resources: { title: string; note: string }[];
}

type Status = "empty" | "loading" | "success" | "error";

function isSummaryData(value: unknown): value is SummaryData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.journey === "string" &&
    Array.isArray(v.insights) &&
    Array.isArray(v.actionItems) &&
    Array.isArray(v.resources)
  );
}

function SectionCard({
  icon,
  title,
  delay,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/30 to-pink-600/20 ring-1 ring-white/10">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

export default function SummaryPage() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const stored = loadMessages();
    // localStorage is unavailable during SSR, so history is synced after mount
    // to keep the prerendered HTML and client's first render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(stored);

    const hasConversation = stored.some(
      (m) => m.sender === "user" && m.kind !== "guardrail"
    );
    if (!hasConversation) {
      setStatus("empty");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: stored }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !isSummaryData(data)) {
          setStatus("error");
          return;
        }
        setSummary(data);
        setStatus("success");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 px-4 py-10 sm:px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/chat"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <Link
            href="/"
            onClick={() => clearMessages()}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Sparkles className="h-4 w-4" />
            New Session
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/30 to-pink-600/20 ring-1 ring-white/10">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Your Session Summary
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            A look back at today&rsquo;s conversation with HeartWise.
          </p>
        </div>

        {status === "empty" && (
          <SectionCard
            icon={<Sparkles className="h-4 w-4 text-rose-400" />}
            title="Today's Journey"
            delay={0}
          >
            <p className="text-sm text-slate-400">
              No conversation yet today — head back to chat to get started.
            </p>
          </SectionCard>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
            <p className="text-sm text-slate-400">
              HeartWise is reflecting on your conversation...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-10 text-center backdrop-blur-md">
            <AlertTriangle className="h-6 w-6 text-amber-300" />
            <p className="text-sm text-amber-200">
              We couldn&rsquo;t generate your personalized summary right now. Please try
              again in a moment.
            </p>
          </div>
        )}

        {status === "success" && summary && (
          <div className="flex flex-col gap-6">
            <SectionCard
              icon={<Sparkles className="h-4 w-4 text-rose-400" />}
              title="Today's Journey"
              delay={0}
            >
              <p className="text-sm leading-6 text-slate-300">{summary.journey}</p>
              <p className="mt-2 text-xs text-slate-500">
                {history.filter((m) => m.sender === "user").length} messages exchanged
                today.
              </p>
            </SectionCard>

            <SectionCard
              icon={<Lightbulb className="h-4 w-4 text-amber-400" />}
              title="Key Insights"
              delay={0.1}
            >
              <ul className="space-y-2 text-sm text-slate-300">
                {summary.insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              title="Action Items"
              delay={0.2}
            >
              <ul className="space-y-2">
                {summary.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              icon={<BookOpen className="h-4 w-4 text-violet-400" />}
              title="Helpful Resources"
              delay={0.3}
            >
              <ul className="space-y-3">
                {summary.resources.map((r, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-medium text-slate-100">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{r.note}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
