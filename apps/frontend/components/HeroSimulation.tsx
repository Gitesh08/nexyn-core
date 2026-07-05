"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Activity } from "lucide-react";
import { AnimatedTerminal } from "./AnimatedTerminal";

function HeroTitle({ onComplete }: { onComplete: () => void }) {
  const fullText1 = "The AI Memory Engine That ";
  const fullText2 = "Learns How to Forget.";
  
  const [typed1, setTyped1] = useState("");
  const [typed2, setTyped2] = useState("");
  const [phase, setPhase] = useState<"typing1" | "typing2" | "done" | "forgetting">("typing1");

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let t1 = 0;
    let t2 = 0;
    const speed = 40; // ms per char
    let activeInterval: any;
    let pauseTimeout: any;
    let forgetTimeout: any;

    const startPhase2 = () => {
      setPhase("typing2");
      activeInterval = setInterval(() => {
        if (t2 <= fullText2.length) {
          setTyped2(fullText2.substring(0, t2));
          t2++;
        } else {
          clearInterval(activeInterval);
          setPhase("done");
          onCompleteRef.current();
          // Trigger "forgetting" effect after 1.5 seconds
          forgetTimeout = setTimeout(() => {
            setPhase("forgetting");
          }, 1500);
        }
      }, speed);
    };

    activeInterval = setInterval(() => {
      if (t1 <= fullText1.length) {
        setTyped1(fullText1.substring(0, t1));
        t1++;
      } else {
        clearInterval(activeInterval);
        pauseTimeout = setTimeout(startPhase2, 100); // tiny pause before next line
      }
    }, speed);

    return () => {
      clearInterval(activeInterval);
      clearTimeout(pauseTimeout);
      clearTimeout(forgetTimeout);
    };
  }, []);

  return (
    <h1 className="text-3xl md:text-6xl lg:text-7xl font-sans font-semibold tracking-tighter text-white mb-6 leading-[1.1] min-h-[80px] md:min-h-[160px]">
      <span className="relative">
        {typed1}
        {phase === "typing1" && (
          <span className="inline-block w-2 md:w-3 h-8 md:h-14 bg-white/80 ml-1 align-middle translate-y-[-2px] md:translate-y-[-4px]" />
        )}
      </span>
      <br className="hidden md:block" />
      <motion.span 
        initial={{ opacity: 1, filter: "grayscale(0%)" }}
        animate={phase === "forgetting" ? { opacity: 0.25, filter: "grayscale(100%)" } : { opacity: 1, filter: "grayscale(0%)" }}
        transition={{ duration: 3, ease: "easeInOut" }}
        className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 inline-block relative"
      >
        {typed2}
        {(phase === "typing2" || phase === "done") && (
          <span className={`inline-block w-2 md:w-3 h-8 md:h-14 bg-white/80 ml-1 align-middle translate-y-[-2px] md:translate-y-[-4px] ${phase === 'done' ? 'animate-pulse' : ''}`} />
        )}
      </motion.span>
    </h1>
  );
}

export function HeroSimulation({ onComplete }: { onComplete?: () => void }) {
  const [showRest, setShowRest] = useState(false);
  const [pypiVersion, setPypiVersion] = useState("v1.0.0");

  useEffect(() => {
    fetch("https://pypi.org/pypi/nexyn-core/json")
      .then((res) => res.json())
      .then((data) => {
        if (data?.info?.version) {
          setPypiVersion(`v${data.info.version}`);
        }
      })
      .catch((err) => console.error("Failed to fetch PyPI version:", err));
  }, []);

  const handleComplete = () => {
    setShowRest(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="w-full flex flex-col relative z-10 font-sans pt-28 pb-24">
      <div className="max-w-5xl mx-auto text-center px-6 mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none -z-10" />

        <motion.a
          href="https://pypi.org/project/nexyn-core/"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A0A0A] border border-[#333333] hover:border-[#555555] hover:bg-[#111111] transition-all cursor-pointer mb-8 group"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-[#A1A1AA] group-hover:text-white transition-colors tracking-wide">Nexyn Core {pypiVersion} is live on PyPI</span>
          <svg className="w-3 h-3 text-[#555555] group-hover:text-white transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.a>

        <HeroTitle onComplete={handleComplete} />

        <AnimatePresence>
          {showRest && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <p
                className="text-[#888888] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light"
              >
                A biomimetic memory layer for Cognee. Filters noise on ingest, decays stale data over time, and compresses high-value patterns into permanent instincts.
              </p>
              
              <div 
                className="mt-8 flex items-center justify-center gap-4"
              >
                <Link
                  href="/demo"
                  className="px-6 h-12 bg-white hover:bg-[#E5E5E5] text-black rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Try Nexyn
                </Link>
                <a
                  href="https://github.com/Gitesh08/nexyn-core"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 h-12 bg-[#0A0A0A] hover:bg-[#111111] border border-[#333333] hover:border-[#555555] text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  View GitHub
                </a>
              </div>

              <AnimatedTerminal />

              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
              >
                <div className="flex flex-col items-center text-center p-6 bg-[#0A0A0A] border border-[#222222] rounded-xl hover:border-[#444444] transition-colors group">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#111111] border border-[#333333] group-hover:border-[#555555] mb-4 text-xl">
                    ⚡
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm tracking-wide">Zero Token Bloat</h3>
                  <p className="text-[#888888] text-xs leading-relaxed">Instantly drops low-valence noise at ingestion to save massive LLM token costs.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-[#0A0A0A] border border-[#222222] rounded-xl hover:border-[#444444] transition-colors group">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#111111] border border-[#333333] group-hover:border-[#555555] mb-4 text-xl">
                    🧠
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm tracking-wide">Biological Decay</h3>
                  <p className="text-[#888888] text-xs leading-relaxed">Temporary working memories naturally dissolve from the graph over time.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-[#0A0A0A] border border-[#222222] rounded-xl hover:border-[#444444] transition-colors group">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#111111] border border-[#333333] group-hover:border-[#555555] mb-4 text-xl">
                    🚀
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm tracking-wide">Native Integration</h3>
                  <p className="text-[#888888] text-xs leading-relaxed">Seamlessly upgrades vanilla Cognee applications with just a single line of code.</p>
                </div>
              </div>

              {/* MASSIVE DEMO TEASER SECTION */}
              <div className="mt-24 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent blur-3xl -z-10 rounded-full" />
                
                <Link href="/demo" className="block w-full group cursor-pointer">
                  <div className="bg-[#050505] border border-[#222222] group-hover:border-[#444444] rounded-2xl overflow-hidden relative transition-all duration-500 hover:shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                    
                    {/* FAKE UI TEASER */}
                    <div className="opacity-40 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none p-4 md:p-10 flex flex-col gap-6 blur-[2px] group-hover:blur-[4px]">
                      <div className="flex justify-between items-center border-b border-[#333333] pb-4">
                        <div className="flex gap-4">
                          <div className="w-32 h-4 bg-[#222222] rounded" />
                          <div className="w-24 h-4 bg-[#222222] rounded" />
                        </div>
                        <div className="w-16 h-4 bg-[#222222] rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-8 h-[200px]">
                        <div className="bg-[#111111] rounded-lg border border-[#222222] p-4 flex flex-col gap-3">
                          <div className="w-1/2 h-3 bg-[#333333] rounded" />
                          <div className="w-3/4 h-3 bg-[#333333] rounded" />
                          <div className="w-full h-3 bg-[#333333] rounded" />
                          <div className="w-5/6 h-3 bg-[#333333] rounded mt-4" />
                        </div>
                        <div className="bg-[#111111] rounded-lg border border-[#222222] p-4 flex flex-col gap-3">
                          <div className="w-1/3 h-3 bg-[#333333] rounded" />
                          <div className="w-2/3 h-3 bg-[#27C93F] rounded opacity-50" />
                          <div className="w-full h-3 bg-[#FF5F56] rounded opacity-50" />
                          <div className="w-4/5 h-3 bg-[#333333] rounded mt-4" />
                        </div>
                      </div>
                    </div>

                    {/* OVERLAY CTA */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 md:p-6 text-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                        <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                      </div>
                      <h2 className="text-xl md:text-4xl font-semibold text-white mb-4 tracking-tight leading-tight">
                        The Context Bloat Problem <br className="hidden md:block"/> (And How We Fix It)
                      </h2>
                      <p className="text-[#A1A1AA] max-w-lg mx-auto mb-6 md:mb-8 text-xs md:text-base">
                        Experience the difference between naive API hoarding and biomimetic pruning in our interactive sandbox.
                      </p>
                      <div className="flex items-center justify-center gap-2 bg-white text-black px-6 md:px-8 h-10 md:h-12 rounded-full font-medium text-xs md:text-sm transition-all group-hover:bg-blue-500 group-hover:text-white shadow-lg">
                        <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                        Launch Live Demo
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                  </div>
                </Link>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
