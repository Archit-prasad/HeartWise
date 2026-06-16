"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState, type PointerEvent } from "react";
import { clearMessages, hasExistingConversation } from "@/lib/chat-storage";
import { FloatingBackground } from "@/components/FloatingBackground";

export default function Home() {
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR, so this is synced after mount
    // to keep the prerendered HTML and client's first render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHistory(hasExistingConversation());
  }, []);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 150, damping: 15, mass: 0.5 });
  const rotateY = useSpring(rawRotateY, { stiffness: 150, damping: 15, mass: 0.5 });

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    rawRotateY.set(((x - bounds.width / 2) / bounds.width) * 12);
    rawRotateX.set((-(y - bounds.height / 2) / bounds.height) * 12);
  };

  const handlePointerLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-slate-950 px-4">
      <FloatingBackground />

      {/* Card tilt zone */}
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative z-10 flex w-full max-w-md items-center justify-center p-10"
        style={{ perspective: 1000 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          whileHover={{ scale: 1.015 }}
          className="relative w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md sm:p-10"
        >
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/30 to-pink-600/20 ring-1 ring-white/10"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="h-10 w-10 fill-rose-500 text-rose-500" strokeWidth={1.5} />
          </motion.div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Welcome to HeartWise
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            Your compassionate AI companion for navigating relationships, one
            conversation at a time.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/chat"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-rose-500/20"
              >
                <MessageCircle className="h-4 w-4" />
                {hasHistory ? "Continue Conversation" : "Start a Conversation"}
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/chat"
                onClick={() => clearMessages()}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                Start Fresh
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
