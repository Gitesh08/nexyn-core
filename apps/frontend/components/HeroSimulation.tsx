"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import Link from "next/link";
import { Terminal, Send, CheckCircle2, AlertTriangle, Check, Sparkles, FileText, ShieldAlert, RotateCcw, Copy } from "lucide-react";

type SimPhase = "idle" | "ingest" | "memify" | "search" | "lifecycle";

function SyntaxLine({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[11px] leading-relaxed tracking-wide flex items-start gap-2">{children}</div>;
}

const CodeStyles = {
  keyword: "text-white font-medium",
  function: "text-[#3b82f6]", 
  string: "text-[#A1A1AA]",   
  variable: "text-[#A1A1AA]", 
  comment: "text-[#888888] italic",
};

export function HeroSimulation() {
  const [inputValue, setInputValue] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Phase Management
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [timelinePhase, setTimelinePhase] = useState(0); // 0=Idle, 1=Ingest, 2=Memify, 3=Search, 4=Lifecycle
  
  const [activeMessage, setActiveMessage] = useState("");
  const [valenceScore, setValenceScore] = useState(1.0);

  const [leftLogs, setLeftLogs] = useState<React.ReactNode[]>([]);
  const [rightLogs, setRightLogs] = useState<React.ReactNode[]>([]);

  // Animated Metrics Display
  const [vanillaTokens, setVanillaTokens] = useState(0);
  const [synapseTokens, setSynapseTokens] = useState(0);
  const [vanillaLatency, setVanillaLatency] = useState(0);
  const [synapseLatency, setSynapseLatency] = useState(0);

  useEffect(() => {
    const targetVanillaTokens = [0, 450, 8500, 16400, 16400];
    const targetSynapseTokens = [0, 450, valenceScore > 1.5 ? 450 : 120, 450, valenceScore > 1.5 ? 250 : 50];
    
    const targetVanillaLat = [0, 12, 120, 850, 850];
    const targetSynapseLat = [0, 15, valenceScore > 1.5 ? 65 : 15, 45, 25];

    const controls1 = animate(vanillaTokens, targetVanillaTokens[timelinePhase], {
      duration: 0.8, ease: "easeOut", onUpdate: (v) => setVanillaTokens(Math.round(v))
    });
    const controls2 = animate(synapseTokens, targetSynapseTokens[timelinePhase], {
      duration: 0.8, ease: "easeOut", onUpdate: (v) => setSynapseTokens(Math.round(v))
    });
    const controls3 = animate(vanillaLatency, targetVanillaLat[timelinePhase], {
      duration: 0.8, ease: "easeOut", onUpdate: (v) => setVanillaLatency(Math.round(v))
    });
    const controls4 = animate(synapseLatency, targetSynapseLat[timelinePhase], {
      duration: 0.8, ease: "easeOut", onUpdate: (v) => setSynapseLatency(Math.round(v))
    });

    return () => {
      controls1.stop();
      controls2.stop();
      controls3.stop();
      controls4.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelinePhase]);

  // --- SVG NODE DATA STRUCTURES ---
  const [hoarderRawBlocks, setHoarderRawBlocks] = useState<{id: number, x: number, y: number}[]>([]);
  const [hoarderNodes, setHoarderNodes] = useState<{id: number, x: number, y: number, connectedTo: number[]}[]>([]);
  
  const [synapseIncoming, setSynapseIncoming] = useState<{id: number, x: number, y: number, score: number} | null>(null);
  const [synapseRawBlocks, setSynapseRawBlocks] = useState<{id: number, x: number, y: number, score: number}[]>([]);
  const [synapseNodes, setSynapseNodes] = useState<{id: number, x: number, y: number, score: number, connectedTo: number[]}[]>([]);
  const [synapseDiamonds, setSynapseDiamonds] = useState<{id: number, x: number, y: number}[]>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText("pip install synapse-core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogPrefix = () => {
    return <span className="text-[#555555] shrink-0 select-none">[MOCK]</span>;
  };

  const calculateScore = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("rule") || lower.includes("docker") || lower.includes("always")) return 4.8;
    if (lower.includes("pdf") || text.length > 20) return 3.5;
    return 1.2;
  };

  const resetSimulation = () => {
    if (isExecuting) return;
    setHoarderRawBlocks([]);
    setHoarderNodes([]);
    setSynapseRawBlocks([]);
    setSynapseNodes([]);
    setSynapseDiamonds([]);
    setLeftLogs([]);
    setRightLogs([]);
    setTimelinePhase(0);
    setPhase("idle");
    setInputValue("");
  };

  const executeSequence = (text: string) => {
    if (isExecuting) return;
    setIsExecuting(true);
    setInputValue("");
    setActiveMessage(text);
    
    const score = calculateScore(text);
    setValenceScore(score);

    // Reset Graph State if we are starting a new run and were finished
    setHoarderRawBlocks([]);
    setHoarderNodes([]);
    setSynapseRawBlocks([]);
    setSynapseNodes([]);
    setSynapseDiamonds([]);
    setLeftLogs([]);
    setRightLogs([]);
    setTimelinePhase(0);
    setPhase("idle");

    // Phase 1: INGESTION (1s delay)
    setTimeout(() => {
      setPhase("ingest");
      setTimelinePhase(1);

      setHoarderRawBlocks([{ id: Date.now(), x: 150 + Math.random() * 100, y: 100 + Math.random() * 80 }]);
      setLeftLogs(l => [...l, 
        <SyntaxLine key={Date.now()}>
          {getLogPrefix()}
          <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.remember</span>(<span className={CodeStyles.variable}>data</span>)</span>
        </SyntaxLine>
      ]);
      
      setSynapseIncoming({ id: Date.now(), x: 200, y: 80, score });
      setRightLogs(l => [...l, 
        <SyntaxLine key={Date.now()}>
          {getLogPrefix()}
          <span><span className={CodeStyles.variable}>score</span> = <span className="text-white font-mono font-bold">Synapse.eval</span>(<span className={CodeStyles.variable}>data</span>) <span className={CodeStyles.comment}>// Score: {score.toFixed(1)}</span></span>
        </SyntaxLine>
      ]);
    }, 500);

    // Phase 2: GRAPH EXTRACTION & MEMIFY (3s delay)
    setTimeout(() => {
      setPhase("memify");
      setTimelinePhase(2);

      // Vanilla BLINDLY extracts
      setLeftLogs(l => [...l, 
        <SyntaxLine key={Date.now()}>
          {getLogPrefix()}
          <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.improve</span>() <span className={CodeStyles.comment}>// Blind extraction</span></span>
        </SyntaxLine>
      ]);

      const newHoarderNodes: typeof hoarderNodes = [];
      for (let i = 0; i < 5; i++) {
        newHoarderNodes.push({
          id: Date.now() + Math.random(),
          x: 200 + (Math.random() - 0.5) * 120, y: 150 + (Math.random() - 0.5) * 120,
          connectedTo: newHoarderNodes.map(n => n.id) // Massive tangled web immediately
        });
      }
      setHoarderRawBlocks([]);
      setHoarderNodes(newHoarderNodes);
      
      // Synapse SELECTIVE Memify
      if (score < 2.0) {
        setRightLogs(l => [...l, 
          <SyntaxLine key={Date.now() + 1}>
            {getLogPrefix()}
            <span><span className={CodeStyles.comment}>// Chitta Layer: Trivial data. Skipping consolidation.</span></span>
          </SyntaxLine>
        ]);
        setSynapseIncoming(null);
        setSynapseRawBlocks([{ id: Date.now(), x: 200, y: 150, score }]);
      } else {
        setRightLogs(l => [...l, 
          <SyntaxLine key={Date.now() + 1}>
            {getLogPrefix()}
            <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.remember</span>() <span className={CodeStyles.comment}>// Selective memory</span></span>
          </SyntaxLine>
        ]);
        setSynapseIncoming(null);
        const newSynapseNodes: typeof synapseNodes = [];
        for (let i = 0; i < 3; i++) {
          newSynapseNodes.push({
            id: Date.now() + Math.random(),
            x: 200 + Math.cos((i * Math.PI * 2) / 3) * 40, y: 150 + Math.sin((i * Math.PI * 2) / 3) * 40,
            score: score, connectedTo: i > 0 ? [newSynapseNodes[i-1].id] : []
          });
        }
        setSynapseNodes(newSynapseNodes);
      }
    }, 2500);

    // Phase 3: RETRIEVAL (5.5s delay)
    setTimeout(() => {
      setPhase("search");
      setTimelinePhase(3);

      setLeftLogs(l => [...l, 
        <SyntaxLine key={Date.now()}>
          {getLogPrefix()}
          <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.recall</span>(<span className={CodeStyles.variable}>query</span>)</span>
        </SyntaxLine>,
        <SyntaxLine key={Date.now()+1}>
          {getLogPrefix()}
          <span className="text-red-500 font-bold">WARNING: Unfiltered Context Pull.</span>
        </SyntaxLine>
      ]);

      setRightLogs(l => [...l, 
        <SyntaxLine key={Date.now()}>
          {getLogPrefix()}
          <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.recall</span>(<span className={CodeStyles.variable}>query</span>)</span>
        </SyntaxLine>
      ]);
    }, 5500);

    // Phase 4: LIFECYCLE (8s delay)
    setTimeout(() => {
      setPhase("lifecycle");
      setTimelinePhase(4);

      setLeftLogs(l => [...l, 
        <SyntaxLine key={Date.now()}>
          {getLogPrefix()}
          <span className="text-[#888888]">Data becomes permanent graph bloat.</span>
        </SyntaxLine>
      ]);

      if (score < 2.0) {
        setRightLogs(l => [...l, 
          <SyntaxLine key={Date.now()}>
            {getLogPrefix()}
            <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.forget</span>() <span className={CodeStyles.comment}>// Data is dropped</span></span>
          </SyntaxLine>
        ]);
        setSynapseRawBlocks([]); // Dissolves to dust
      } else if (score > 4.0) {
        setRightLogs(l => [...l, 
          <SyntaxLine key={Date.now()}>
            {getLogPrefix()}
            <span><span className={CodeStyles.keyword}>await</span> <span className="text-white font-mono font-bold">cognee.improve</span>() <span className={CodeStyles.comment}>// Data is permanently consolidated</span></span>
          </SyntaxLine>
        ]);
        setSynapseNodes([]);
        setSynapseDiamonds([{ id: Date.now(), x: 200, y: 150 }]);
      } else {
        setRightLogs(l => [...l, 
          <SyntaxLine key={Date.now()}>
            {getLogPrefix()}
            <span><span className={CodeStyles.comment}>// Ahamkara: Standard decay tracking started.</span></span>
          </SyntaxLine>
        ]);
      }

      setTimeout(() => setIsExecuting(false), 1000);
    }, 8500);
  };

  const leftLogsRef = useRef<HTMLDivElement>(null);
  const rightLogsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (leftLogsRef.current) leftLogsRef.current.scrollTop = leftLogsRef.current.scrollHeight;
    if (rightLogsRef.current) rightLogsRef.current.scrollTop = rightLogsRef.current.scrollHeight;
  }, [leftLogs, rightLogs]);

  const viewBox = "0 0 400 300";
  const timelineSteps = ["1. Ingest", "2. Extract", "3. Retrieve", "4. Prune"];

  return (
    <div className="w-full flex flex-col relative z-10 font-sans pt-28 pb-24">
      {/* 1. HERO HEADER */}
      <div className="max-w-5xl mx-auto text-center px-6 mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-sans font-semibold tracking-tighter text-white mb-6 leading-[1.1]"
        >
          The AI Memory Engine <br className="hidden md:block" />
          <span className="text-[#888888]">That Learns How to Forget.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm md:text-base lg:text-lg text-[#888888] mb-10 max-w-3xl mx-auto font-normal leading-relaxed"
        >
          Watch vector graphs bloat. Watch Synapse self-prune.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-md overflow-hidden rounded-md bg-[#0A0A0A] border border-[#333333] relative group"
        >
          <div className="flex items-center justify-between border-b border-[#333333] px-4 py-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#888888]">
              <Terminal className="h-3.5 w-3.5" />
              <span>bash</span>
            </div>
            <button 
              onClick={handleCopy}
              className="text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>
          <div className="p-4 text-sm font-mono text-[#A1A1AA] flex items-center justify-start gap-4">
            <span className="text-[#333333] select-none">$</span>
            <span className="text-white">pip install synapse-core</span>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {!isPlaygroundOpen ? (
          <motion.div
            key="gateway"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-4xl mx-auto px-6 py-24 flex flex-col items-center justify-center border border-[#333333] rounded-md bg-[#0A0A0A]"
          >
            <h2 className="text-2xl md:text-4xl font-semibold text-white tracking-tighter mb-4 text-center">
              The Context Bloat Problem <br className="md:hidden" /> (And How We Fix It)
            </h2>
            <p className="text-[#888888] mb-10 text-center max-w-lg font-normal">
              Experience the difference between naive API hoarding and biomimetic pruning.
            </p>
            <Link
              href="/demo"
              className="px-8 h-12 bg-white hover:bg-[#E5E5E5] text-black rounded font-medium text-sm transition-colors flex items-center justify-center"
            >
              Launch Live Demo
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="playground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full"
          >
            {/* 2. SPLIT SCREEN PLAYGROUND */}
            <div className="w-full max-w-[1400px] mx-auto px-6 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
                
                {/* LEFT: VANILLA HOARDER */}
                <div className="flex flex-col bg-[#0A0A0A] rounded-md border border-[#333333] overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-[#333333] z-20 bg-black flex justify-between items-center">
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                      Hoarder AI <span className="text-[#888888] font-normal hidden sm:inline">(Vanilla Cognee)</span>
                    </h3>
                  </div>
                  
                  <div className="h-32 bg-[#050505] border-b border-[#333333] p-4 font-mono overflow-y-auto" ref={leftLogsRef}>
                    {leftLogs.length === 0 && <span className="opacity-50 text-[11px] text-[#A1A1AA]">Waiting for ingestion trigger...</span>}
                    {leftLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>

                  <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
                    
                    {/* Visual Highlights based on phase */}
                    <AnimatePresence>
                      {phase === "search" && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, repeat: 10, repeatType: "reverse" }}
                          className="absolute inset-0 bg-red-600 z-10 pointer-events-none mix-blend-color"
                        />
                      )}
                    </AnimatePresence>

                    <svg viewBox={viewBox} className="absolute inset-0 w-full h-full">
                      {/* INGEST */}
                      <AnimatePresence>
                        {hoarderRawBlocks.map(block => (
                          <motion.rect
                            key={block.id}
                            initial={{ y: block.y - 100, opacity: 0 }}
                            animate={{ y: block.y, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            x={block.x - 15} y={block.y - 10}
                            width={30} height={20} fill="#333333" rx={2} stroke="#555555" strokeWidth={1}
                          />
                        ))}
                      </AnimatePresence>

                      {/* MEMIFY (Tangled Web) */}
                      {hoarderNodes.map(node => (
                        <g key={node.id}>
                          {node.connectedTo.map(targetId => {
                            const target = hoarderNodes.find(n => n.id === targetId);
                            if (target) {
                              const isSearch = phase === "search" || phase === "lifecycle";
                              return (
                                <motion.line
                                  key={`${node.id}-${targetId}`}
                                  x1={node.x} y1={node.y} x2={target.x} y2={target.y}
                                  stroke={isSearch ? "#ef4444" : "rgba(239, 68, 68, 0.4)"} 
                                  strokeWidth={isSearch ? 2 : 1}
                                  initial={{ pathLength: 0, opacity: 0 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                />
                              );
                            }
                            return null;
                          })}
                          <motion.circle 
                            cx={node.x} cy={node.y} r={5} 
                            fill={phase === "search" ? "#ffffff" : "#ef4444"} 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                          />
                        </g>
                      ))}
                    </svg>
                    
                    <div className="absolute bottom-4 left-4 right-4 p-4 rounded-md bg-[#0A0A0A]/90 border border-[#333333] flex justify-between items-center z-20">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#888888] uppercase tracking-widest font-medium mb-1">Token Payload</span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-mono tracking-tight transition-colors ${vanillaTokens > 10000 ? "text-red-500 font-bold" : "text-white"}`}>
                            {vanillaTokens.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-medium text-[#ef4444]">BLOAT</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-[#888888] uppercase tracking-widest font-medium mb-1">Retrieval Latency</span>
                        <span className={`text-xl font-mono tracking-tight transition-colors ${vanillaLatency > 400 ? "text-red-500 font-bold" : "text-white"}`}>
                          {vanillaLatency}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: PROJECT SYNAPSE */}
                <div className="flex flex-col bg-[#0A0A0A] rounded-md border border-[#333333] overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-[#333333] z-20 bg-black flex justify-between items-center">
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                      Project Synapse <span className="text-[#888888] font-normal hidden sm:inline">(4-Layer Architecture)</span>
                    </h3>
                  </div>

                  <div className="h-32 bg-[#050505] border-b border-[#333333] p-4 font-mono overflow-y-auto" ref={rightLogsRef}>
                    {rightLogs.length === 0 && <span className="opacity-50 text-[11px] text-[#A1A1AA]">Waiting for ingestion trigger...</span>}
                    {rightLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>

                  <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">

                    <svg viewBox={viewBox} className="absolute inset-0 w-full h-full">
                      {/* INGEST & EVALUATE */}
                      <AnimatePresence>
                        {phase === "ingest" && synapseIncoming && (
                          <g>
                            <motion.rect
                              initial={{ y: 0, opacity: 0 }}
                              animate={{ y: synapseIncoming.y, opacity: 1 }}
                              exit={{ opacity: 0 }}
                              x={synapseIncoming.x - 20} y={synapseIncoming.y - 15}
                              width={40} height={30} 
                              fill={synapseIncoming.score > 2.0 ? "#eab308" : "#555555"} 
                              rx={4} 
                            />
                            {/* Scanning Laser (Buddhi SLM) */}
                            <motion.line
                              initial={{ y1: synapseIncoming.y - 20, y2: synapseIncoming.y - 20 }}
                              animate={{ y1: synapseIncoming.y + 20, y2: synapseIncoming.y + 20 }}
                              transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                              x1={synapseIncoming.x - 30} x2={synapseIncoming.x + 30}
                              stroke="#ffffff" strokeWidth={2}
                              style={{ filter: "drop-shadow(0 0 5px #ffffff)" }}
                            />
                            <text x={synapseIncoming.x + 35} y={synapseIncoming.y + 5} fill="white" fontSize="12" fontFamily="monospace">
                              Score: {synapseIncoming.score.toFixed(1)}
                            </text>
                          </g>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {synapseRawBlocks.map(block => (
                          <motion.rect
                            key={block.id}
                            initial={{ y: block.y - 50, opacity: 0 }}
                            animate={{ y: block.y, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
                            transition={{ duration: 0.5 }}
                            x={block.x - 15} y={block.y - 10}
                            width={30} height={20} fill="#555555" rx={2} 
                          />
                        ))}
                      </AnimatePresence>

                      {/* SELECTIVE MEMIFY & SEARCH */}
                      <AnimatePresence>
                        {synapseNodes.map(node => (
                          <motion.g key={node.id} exit={{ opacity: 0, scale: 0 }}>
                            {node.connectedTo.map(targetId => {
                              const target = synapseNodes.find(n => n.id === targetId);
                              if (target) {
                                const isSearch = phase === "search";
                                return (
                                  <motion.line
                                    key={`${node.id}-${targetId}`}
                                    x1={node.x} y1={node.y} x2={target.x} y2={target.y}
                                    stroke={isSearch ? "#3b82f6" : "#333333"} 
                                    strokeWidth={isSearch ? 2 : 1}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                  />
                                );
                              }
                              return null;
                            })}
                            <circle cx={node.x} cy={node.y} r={5} fill={node.score > 4.0 ? "#eab308" : "#3b82f6"} />
                          </motion.g>
                        ))}
                      </AnimatePresence>

                      {/* LIFECYCLE: PRUNE / IMPROVE */}
                      <AnimatePresence>
                        {synapseDiamonds.map(diamond => (
                          <motion.polygon
                            key={diamond.id}
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            points={`${diamond.x},${diamond.y - 15} ${diamond.x + 15},${diamond.y} ${diamond.x},${diamond.y + 15} ${diamond.x - 15},${diamond.y}`}
                            fill="#eab308"
                            stroke="#ffffff" strokeWidth={1}
                            style={{ filter: "drop-shadow(0 0 20px rgba(234,179,8,0.8))" }}
                          />
                        ))}
                      </AnimatePresence>

                    </svg>

                    <div className="absolute bottom-4 left-4 right-4 p-4 rounded-md bg-[#0A0A0A]/90 border border-[#333333] flex justify-between items-center z-20">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#888888] uppercase tracking-widest font-medium mb-1">Token Payload</span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-mono tracking-tight transition-colors ${synapseTokens > 10000 ? "text-red-500 font-bold" : "text-white"}`}>
                            {synapseTokens.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-medium text-[#3b82f6]">OPTIMIZED</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-[#888888] uppercase tracking-widest font-medium mb-1">Retrieval Latency</span>
                        <span className={`text-xl font-mono tracking-tight transition-colors ${synapseLatency > 400 ? "text-red-500 font-bold" : "text-white"}`}>
                          {synapseLatency}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. THE UNIFIED CHAT CONTROLLER */}
            <div className="flex flex-col max-w-4xl mx-auto w-full px-6">
              
              {/* API Execution Debugger Timeline */}
              <div className="flex items-center justify-between bg-[#0A0A0A] rounded-t-md border border-[#333333] p-4 flex-wrap gap-4 border-b-0">
                <div className="flex items-center gap-5 text-xs font-medium uppercase tracking-widest pl-2">
                  {timelineSteps.map((stepName, idx) => {
                    const stepNumber = idx + 1;
                    const isActive = timelinePhase === stepNumber;
                    const isCompleted = timelinePhase > stepNumber;
                    
                    return (
                      <div key={stepName} className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 transition-colors duration-300 ${isActive ? "text-white" : isCompleted ? "text-[#555555]" : "text-[#333333]"}`}>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_#ffffff]" />}
                          {isCompleted ? <Check className="w-3 h-3 text-[#555555]" /> : null}
                          <span className={isCompleted ? "line-through opacity-70" : ""}>{stepName}</span>
                        </div>
                        {idx < timelineSteps.length - 1 && (
                          <div className={`w-4 h-[1px] ${timelinePhase > stepNumber ? "bg-[#333333]" : "bg-[#111111]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={resetSimulation}
                  disabled={isExecuting || timelinePhase === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#333333] text-[#ef4444] hover:text-white hover:bg-red-950 hover:border-red-500 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Simulation</span>
                </button>
              </div>

              {/* Input Pipeline */}
              <div className="flex flex-col bg-[#050505] rounded-b-md border border-[#333333] p-4 gap-4">
                
                {/* Quick-Inject Chips */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-[#555555] uppercase tracking-widest font-medium mr-2">Quick Inject:</span>
                  <button 
                    disabled={isExecuting}
                    onClick={() => executeSequence("Hello! Just checking in.")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#333333] bg-[#0A0A0A] hover:bg-[#111111] hover:border-[#555555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span>👋</span>
                    <span className="text-xs text-[#A1A1AA] group-hover:text-white">"Hello!" (Spam)</span>
                  </button>
                  <button 
                    disabled={isExecuting}
                    onClick={() => executeSequence("Attached 50-page PDF containing project specifications...")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#333333] bg-[#0A0A0A] hover:bg-[#111111] hover:border-[#555555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white" />
                    <span className="text-xs text-[#A1A1AA] group-hover:text-white">"50-Page PDF" (Data)</span>
                  </button>
                  <button 
                    disabled={isExecuting}
                    onClick={() => executeSequence("System Rule: Code must never use Docker.")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#eab308]/30 bg-[#0A0A0A] hover:bg-[#111111] hover:border-[#eab308]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#eab308]" />
                    <span className="text-xs text-[#A1A1AA] group-hover:text-white">"Rule: No Docker" (Instinct)</span>
                  </button>
                </div>

                {/* Chat Input Bar */}
                <div className="flex items-center gap-2 relative">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && executeSequence(inputValue)}
                    placeholder={isExecuting ? "Execution in progress..." : "Type a custom memory to inject..."} 
                    disabled={isExecuting}
                    className="flex-1 bg-black border border-[#333333] rounded text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#555555] h-12 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button 
                    onClick={() => executeSequence(inputValue)}
                    disabled={isExecuting || !inputValue.trim()}
                    className="absolute right-2 px-4 h-8 bg-white hover:bg-[#E5E5E5] text-black rounded transition-colors flex items-center justify-center gap-2 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
