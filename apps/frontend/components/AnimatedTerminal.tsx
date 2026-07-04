"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

type LineType = "input" | "output" | "empty";

interface ScriptLine {
  id: string;
  type: LineType;
  text: string;
  delayBefore?: number; 
  typingSpeed?: number;
}

const script: ScriptLine[] = [
  { id: "1", type: "input", text: "$ pip install nexyn-core cognee", delayBefore: 500, typingSpeed: 30 },
  { id: "e1", type: "empty", text: "", delayBefore: 200 },
  
  { id: "2", type: "input", text: "$ await nexyn.inject(", delayBefore: 500, typingSpeed: 30 },
  { id: "3", type: "input", text: "    nim_api_key=\"nvapi-your-key-here\",", delayBefore: 100, typingSpeed: 10 },
  { id: "4", type: "input", text: "    cognee_api_key=\"your_cognee_api_key\",", delayBefore: 100, typingSpeed: 10 },
  { id: "5", type: "input", text: "    cognee_url=\"https://api.cognee.ai\",", delayBefore: 100, typingSpeed: 10 },
  { id: "6", type: "input", text: "    tenant_id=\"default\",", delayBefore: 100, typingSpeed: 10 },
  { id: "7", type: "input", text: "    user_id=\"user_123\"", delayBefore: 100, typingSpeed: 10 },
  { id: "8", type: "input", text: ")", delayBefore: 100, typingSpeed: 10 },
  { id: "9", type: "output", text: "✓ biological memory pipeline active · evaluator connected", delayBefore: 500 },
  { id: "e2", type: "empty", text: "", delayBefore: 200 },
  
  { id: "10", type: "input", text: "$ await cognee.add(\"Doug is the groom. The wedding is Sunday.\")", delayBefore: 600, typingSpeed: 25 },
  { id: "11", type: "output", text: "→ valence score: 3.5 · fact recognized", delayBefore: 600 },
  { id: "12", type: "output", text: "✓ saved to sensory buffer", delayBefore: 150 },
  { id: "e3", type: "empty", text: "", delayBefore: 200 },
  
  { id: "13", type: "input", text: "$ await cognee.cognify()", delayBefore: 600, typingSpeed: 30 },
  { id: "14", type: "output", text: "✓ graph built · 1 entity consolidated", delayBefore: 800 },
  { id: "e4", type: "empty", text: "", delayBefore: 200 },
  
  { id: "15", type: "input", text: "$ await cognee.search(\"Where is Doug?\")", delayBefore: 600, typingSpeed: 30 },
  { id: "16", type: "output", text: "✓ search 24ms · memory decay timer reset", delayBefore: 600 },
  { id: "e5", type: "empty", text: "", delayBefore: 200 },
  
  { id: "17", type: "input", text: "$ await nexyn.sweep()", delayBefore: 600, typingSpeed: 30 },
  { id: "18", type: "output", text: "✓ sweep complete · 0 dead nodes pruned", delayBefore: 600 },
];

function highlightSyntax(text: string, type: LineType) {
  if (type === "empty") return <span>&nbsp;</span>;
  
  if (type === "output") {
    if (text.includes("✓")) {
      const parts = text.split("✓");
      return (
        <span className="text-[#A1A1AA]">
          {parts[0]}<span className="text-[#c678dd] font-bold">✓</span>{parts[1]}
        </span>
      );
    }
    if (text.includes("→")) {
      const parts = text.split("→");
      return (
        <span className="text-[#A1A1AA]">
          {parts[0]}<span className="text-[#A1A1AA] font-bold">→</span>{parts[1]}
        </span>
      );
    }
    return <span className="text-[#A1A1AA]">{text}</span>;
  }

  // Code input
  const leadingSpaces = text.match(/^\s*/)?.[0] || "";
  const trimmed = text.trim();
  
  // Custom parsing for this exact format
  let content = [];
  
  if (trimmed.startsWith("$")) {
    const withoutDollar = trimmed.substring(1).trim();
    content.push(<span key="dollar" className="text-[#c678dd] font-bold mr-2">$</span>);
    
    // Check keywords in the rest of the line
    const parts = withoutDollar.split(/(\(|\)|\"|\')/);
    
    let inString = false;
    parts.forEach((p, i) => {
      if (p === '"' || p === "'") {
        inString = !inString;
        content.push(<span key={`strq_${i}`} className="text-[#A1A1AA]">{p}</span>);
      } else if (inString) {
        content.push(<span key={`str_${i}`} className="text-[#A1A1AA]">{p}</span>);
      } else if (p === "await") {
        content.push(<span key={`kw_${i}`} className="text-white">{p}</span>); // The screenshot has await as white
      } else if (p.includes("nexyn") || p.includes("cognee") || p.includes("pip") || p.includes("install")) {
        content.push(<span key={`mod_${i}`} className="text-white">{p}</span>);
      } else {
        content.push(<span key={`rest_${i}`} className="text-white">{p}</span>);
      }
    });
  } else {
    // These are the indented kwargs
    const parts = trimmed.split(/(\"|\'|\=|\,)/);
    let inString = false;
    parts.forEach((p, i) => {
      if (p === '"' || p === "'") {
        inString = !inString;
        content.push(<span key={`strq_${i}`} className="text-[#A1A1AA]">{p}</span>);
      } else if (inString) {
        content.push(<span key={`str_${i}`} className="text-[#A1A1AA]">{p}</span>);
      } else if (p === "=" || p === ",") {
        content.push(<span key={`punct_${i}`} className="text-white">{p}</span>);
      } else {
        content.push(<span key={`key_${i}`} className="text-white">{p}</span>);
      }
    });
  }

  return <span><span className="whitespace-pre">{leadingSpaces}</span>{content}</span>;
}

export function AnimatedTerminal() {
  const [renderedLines, setRenderedLines] = useState<{ id: string, text: string, type: LineType }[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const resetAnimation = () => {
    setRenderedLines([]);
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsDone(false);
    setPlayCount(p => p + 1);
  };

  useEffect(() => {
    if (!isInView || isDone) return;

    if (currentLineIndex >= script.length) {
      setIsDone(true);
      return;
    }

    const line = script[currentLineIndex];

    if (currentCharIndex === 0) {
      const timeout = setTimeout(() => {
        if (line.type === "output" || line.type === "empty") {
          setRenderedLines(prev => [...prev, { id: line.id, text: line.text, type: line.type }]);
          setCurrentLineIndex(i => i + 1);
        } else {
          setRenderedLines(prev => [...prev, { id: line.id, text: "", type: line.type }]);
          setCurrentCharIndex(1);
        }
      }, line.delayBefore || 0);
      return () => clearTimeout(timeout);
    } else {
      if (currentCharIndex <= line.text.length) {
        const timeout = setTimeout(() => {
          setRenderedLines(prev => {
            const next = [...prev];
            next[next.length - 1].text = line.text.substring(0, currentCharIndex);
            return next;
          });
          setCurrentCharIndex(c => c + 1);
        }, line.typingSpeed || 20);
        return () => clearTimeout(timeout);
      } else {
        setCurrentLineIndex(i => i + 1);
        setCurrentCharIndex(0);
      }
    }
  }, [currentLineIndex, currentCharIndex, isDone, playCount, isInView]);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-4xl w-full overflow-hidden rounded-xl bg-[#111111] shadow-2xl relative group text-left mt-24 border border-[#222222]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222222] px-4 py-3 bg-[#161616]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          <div className="text-xs font-mono text-[#555555] select-none ml-4 flex items-center gap-2">
            <span>cognee@localhost:8000</span>
          </div>
        </div>
        <div className="text-[10px] font-mono tracking-widest text-[#555555] uppercase select-none">
          {isDone ? "DONE" : "RUNNING"}
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 sm:p-6 text-[10.5px] sm:text-[12px] md:text-[14px] font-mono leading-[1.6] sm:leading-[1.7] h-[450px] sm:h-[550px] md:h-[650px] bg-[#111111] overflow-y-auto scrollbar-hide flex flex-col">
        <AnimatePresence>
          {renderedLines.map((line, idx) => {
            const isCurrentTyping = idx === renderedLines.length - 1 && !isDone && line.type === "input" && line.text !== script[currentLineIndex]?.text;
            
            return (
              <motion.div 
                key={line.id} 
                initial={line.type === "output" ? { opacity: 0, y: 5 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-start"
              >
                <div className="flex-1 min-w-0">
                  {highlightSyntax(line.text, line.type)}
                  {isCurrentTyping && (
                    <span className="inline-block w-2 h-4 bg-white/70 ml-1 animate-pulse align-middle translate-y-[-2px]" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isDone && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 flex"
          >
            <span className="inline-block w-2.5 h-4 sm:h-5 bg-[#555555] animate-pulse align-middle translate-y-[-1px]" />
          </motion.div>
        )}
      </div>

      {/* Footer / Replay Bar */}
      <div className="flex items-center justify-between border-t border-[#222222] px-4 sm:px-6 py-3 sm:py-4 bg-[#161616] flex-wrap gap-4">
        <div className="flex flex-wrap gap-4 sm:gap-6 text-[9px] sm:text-[11px] font-mono uppercase tracking-widest text-[#555555] select-none min-h-[16px]">
          <AnimatePresence>
            {isDone && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex gap-4 sm:gap-6"
              >
                <span><strong className="text-[#3b82f6]">4</strong> LAYERS</span>
                <span><strong className="text-[#c678dd]">1</strong> EGO</span>
                <span><strong className="text-[#eab308]">842</strong> MEMORIES</span>
                <span><strong className="text-[#ef4444]">32</strong> PRUNED</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-1.5 bg-[#222222] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#c678dd]"
              initial={{ width: "0%" }}
              animate={{ width: isDone ? "100%" : `${(currentLineIndex / script.length) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <button 
            onClick={resetAnimation}
            className="px-4 py-1.5 border border-[#333333] hover:border-[#555555] hover:text-white rounded text-[10px] font-mono tracking-widest text-[#A1A1AA] transition-colors"
          >
            REPLAY
          </button>
        </div>
      </div>
    </motion.div>
  );
}
