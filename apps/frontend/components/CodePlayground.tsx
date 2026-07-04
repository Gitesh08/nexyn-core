"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

export function CodePlayground() {
  const [activeTab, setActiveTab] = useState<"vanilla" | "nexyn">("nexyn");

  return (
    <div id="playground" className="w-full max-w-4xl mx-auto py-24 px-6 relative z-10 font-sans">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tighter mb-4">
          Integration Sandbox
        </h2>
        <p className="text-[#888888] font-normal">
          Toggle between Vanilla Cognee and Project Nexyn syntax.
        </p>
      </div>

      <div className="bg-[#0A0A0A] rounded-md border border-[#333333] overflow-hidden">
        {/* IDE Header */}
        <div className="flex items-center justify-between border-b border-[#333333] bg-[#0A0A0A] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#333333]" />
              <div className="w-3 h-3 rounded-full bg-[#333333]" />
              <div className="w-3 h-3 rounded-full bg-[#333333]" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("vanilla")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === "vanilla" 
                  ? "bg-white text-black" 
                  : "text-[#888888] hover:text-white"
              }`}
            >
              Vanilla Cognee
            </button>
            <button
              onClick={() => setActiveTab("nexyn")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
                activeTab === "nexyn" 
                  ? "bg-white text-black" 
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Project Nexyn
            </button>
          </div>
        </div>

        {/* IDE Editor Content */}
        <div className="relative h-[300px] bg-black p-6 font-mono text-[13px] leading-relaxed overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "vanilla" ? (
              <motion.div
                key="vanilla"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-6"
              >
                <div className="text-[#888888]">
                  <span className="text-[#888888]">{"// 1. Unfiltered ingestion (Causes Bloat)"}</span><br/>
                  <span className="text-white">import</span> {"{ cognee }"} <span className="text-white">from</span> <span className="text-[#A1A1AA]">'cognee'</span>;<br/>
                  <br/>
                  <span className="text-white">const</span> data = <span className="text-[#A1A1AA]">"User accidentally pasted a 500-page terms of service here."</span>;<br/>
                  <br/>
                  <span className="text-white">await</span> cognee.add(data);<br/>
                  <span className="text-white">await</span> cognee.cognify();<br/>
                  <br/>
                  <span className="text-[#888888]">{"// Result: The entire 500-page doc is permanently vectorized."}</span><br/>
                  <span className="text-[#888888]">{"// Next search for 'user preferences' will lag out."}</span><br/>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="nexyn"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-6"
              >
                <div className="text-[#A1A1AA]">
                  <span className="text-[#888888]">{"// 1. Biological Ingestion (Prunes Garbage)"}</span><br/>
                  <span className="text-white">import</span> {"{ Nexyn }"} <span className="text-white">from</span> <span className="text-[#A1A1AA]">'@veda/nexyn'</span>;<br/>
                  <br/>
                  <span className="text-white">const</span> data = <span className="text-[#A1A1AA]">"User accidentally pasted a 500-page terms of service here."</span>;<br/>
                  <br/>
                  <span className="text-[#888888]">{"// Buddhi immediately calculates the valency score."}</span><br/>
                  <span className="text-white">const</span> score = <span className="text-white">await</span> Nexyn.evaluate(data); <span className="text-[#888888]">{"// Score: 1.2 (Trivial)"}</span><br/>
                  <br/>
                  <span className="text-[#888888]">{"// Route dynamically based on score."}</span><br/>
                  <span className="text-white">await</span> Nexyn.route(data, score);<br/>
                  <br/>
                  <span className="text-[#888888]">{"// Result: Placed in the Sensory Buffer."}</span><br/>
                  <span className="text-[#888888]">{"// Evicts automatically at midnight."}</span><br/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
