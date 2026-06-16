"use client";

import { motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EMOJI_LAYOUT = [
  { emoji: "💖", top: "8%", left: "12%", size: 26, duration: 9, delay: 0, rotate: 10 },
  { emoji: "💬", top: "18%", left: "78%", size: 30, duration: 11, delay: 1.2, rotate: -8 },
  { emoji: "✨", top: "65%", left: "8%", size: 22, duration: 8, delay: 0.6, rotate: 12 },
  { emoji: "🌹", top: "75%", left: "85%", size: 28, duration: 12, delay: 2, rotate: -10 },
  { emoji: "💔", top: "5%", left: "45%", size: 24, duration: 10, delay: 1.8, rotate: 6 },
  { emoji: "💌", top: "50%", left: "92%", size: 26, duration: 13, delay: 0.3, rotate: -12 },
  { emoji: "💕", top: "38%", left: "5%", size: 20, duration: 9.5, delay: 2.4, rotate: 8 },
  { emoji: "⭐", top: "88%", left: "55%", size: 18, duration: 10.5, delay: 1, rotate: -6 },
  { emoji: "💞", top: "28%", left: "30%", size: 22, duration: 11.5, delay: 0.9, rotate: 10 },
  { emoji: "🤍", top: "60%", left: "65%", size: 20, duration: 9, delay: 1.6, rotate: -8 },
  { emoji: "💭", top: "15%", left: "60%", size: 24, duration: 12.5, delay: 0.2, rotate: 6 },
  { emoji: "🌙", top: "82%", left: "20%", size: 22, duration: 10, delay: 2.2, rotate: -10 },
  { emoji: "💗", top: "45%", left: "48%", size: 18, duration: 8.5, delay: 1.4, rotate: 8 },
  { emoji: "🫶", top: "92%", left: "75%", size: 24, duration: 11, delay: 0.5, rotate: -6 },
] as const;

const REPEL_RADIUS = 140;
const REPEL_STRENGTH = 28;

type Item = (typeof EMOJI_LAYOUT)[number];

function FloatingEmoji({
  item,
  mouseX,
  mouseY,
}: {
  item: Item;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setBase({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const offsetX = useTransform([mouseX, mouseY], (values) => {
    const [mx, my] = values as number[];
    if (!base) return 0;
    const dx = base.x - mx;
    const dy = base.y - my;
    const dist = Math.hypot(dx, dy);
    if (dist >= REPEL_RADIUS || dist === 0) return 0;
    return (dx / dist) * (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
  });

  const offsetY = useTransform([mouseX, mouseY], (values) => {
    const [mx, my] = values as number[];
    if (!base) return 0;
    const dx = base.x - mx;
    const dy = base.y - my;
    const dist = Math.hypot(dx, dy);
    if (dist >= REPEL_RADIUS || dist === 0) return 0;
    return (dy / dist) * (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
  });

  return (
    <motion.div
      ref={ref}
      className="absolute select-none"
      style={{ top: item.top, left: item.left, x: offsetX, y: offsetY }}
    >
      <motion.div
        style={{ fontSize: item.size, lineHeight: 1 }}
        animate={{
          y: [0, -16, 0],
          rotate: [0, item.rotate, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {item.emoji}
      </motion.div>
    </motion.div>
  );
}

export function FloatingBackground() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [mouseX, mouseY]);

  const auraBackground = useMotionTemplate`radial-gradient(560px circle at ${mouseX}px ${mouseY}px, rgba(244,63,94,0.18), rgba(168,85,247,0.12), transparent 70%)`;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ background: auraBackground }} />
      {EMOJI_LAYOUT.map((item, i) => (
        <FloatingEmoji key={i} item={item} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
}
