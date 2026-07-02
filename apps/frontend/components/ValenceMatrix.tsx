"use client";

import { motion } from "framer-motion";

const matrixData = [
  {
    score: "1.0",
    classification: "Ephemeral/Junk",
    rule: "Typos, filler, greetings, trivial chitchat.",
    destiny: "Instantly Dropped",
    color: "bg-[#888888]", // Grey
  },
  {
    score: "2.0",
    classification: "Session Context",
    rule: "Useful only right now, no long-term value.",
    destiny: "Short Lifecycle (3d)",
    color: "bg-[#06b6d4]", // Cyan
  },
  {
    score: "3.0",
    classification: "General Fact",
    rule: "Stable, publicly known fact with relevance.",
    destiny: "Standard Decay (Weeks)",
    color: "bg-[#3b82f6]", // Blue
  },
  {
    score: "4.0",
    classification: "High-Value Memory",
    rule: "Personal preference, recurring pattern, strong opinion.",
    destiny: "Consolidated via Cognee Cloud",
    color: "bg-[#a855f7]", // Purple
  },
  {
    score: "5.0",
    classification: "Core Instinct",
    rule: "Explicit directive, hard constraint, identity-level rule.",
    destiny: "Mathematically Immortal",
    color: "bg-[#ef4444]", // Red
  },
];

export function ValenceMatrix() {
  return (
    <div className="w-full max-w-5xl mx-auto py-24 px-6 relative z-10 font-sans">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tighter mb-2">
          Valence Matrix
        </h2>
        <p className="text-[#888888] font-normal">
          Strict evaluation rubric for memory retention.
        </p>
      </div>

      <div className="flex flex-col border-t border-[#333333]">
        {/* Header Row (hidden on mobile for cleanliness, visible on md+) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-[#333333] text-xs uppercase tracking-widest text-[#888888] font-medium hidden md:grid">
          <div>Score</div>
          <div>Classification</div>
          <div>Semantic Rule</div>
          <div>Lifecycle Destiny</div>
        </div>

        {/* Data Rows */}
        {matrixData.map((row, i) => (
          <motion.div 
            key={row.score}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6 border-b border-[#333333] items-start md:items-center"
          >
            {/* Score */}
            <div className="flex items-center gap-3">
              <div className={`w-[6px] h-[6px] rounded-full ${row.color}`} />
              <span className="text-xl font-mono text-white tracking-tight">{row.score}</span>
            </div>
            
            {/* Classification */}
            <div className="text-sm font-medium text-white">
              <span className="md:hidden text-[#888888] text-[10px] uppercase tracking-widest block mb-1">Classification</span>
              {row.classification}
            </div>

            {/* Semantic Rule */}
            <div className="text-sm text-[#A1A1AA]">
              <span className="md:hidden text-[#888888] text-[10px] uppercase tracking-widest block mb-1">Semantic Rule</span>
              {row.rule}
            </div>

            {/* Lifecycle Destiny */}
            <div className="text-sm font-medium text-white">
              <span className="md:hidden text-[#888888] text-[10px] uppercase tracking-widest block mb-1">Lifecycle Destiny</span>
              {row.destiny}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
