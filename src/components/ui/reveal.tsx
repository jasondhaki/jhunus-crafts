"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Motion tokens from CLAUDE.md: "subtle and slow — 200-400ms ease-out",
// and always respect prefers-reduced-motion.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.4,
        delay: shouldReduceMotion ? 0 : delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
