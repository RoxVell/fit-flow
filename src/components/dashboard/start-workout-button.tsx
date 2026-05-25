"use client";

import { motion } from "framer-motion";
import { Dumbbell, Play } from "lucide-react";
import Link from "next/link";

export function StartWorkoutButton() {
  return (
    <Link href="/workout/active" className="block px-2">
      <motion.div
        className="relative flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-5 text-primary-foreground shadow-lg shadow-primary/30"
        whileTap={{ scale: 0.97 }}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/40"
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
        />
        <Dumbbell className="relative h-7 w-7" />
        <span className="relative text-lg font-bold">Start Workout</span>
        <Play className="relative h-5 w-5" fill="currentColor" />
      </motion.div>
    </Link>
  );
}
