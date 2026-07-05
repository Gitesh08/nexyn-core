"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

export function CodePlayground() {
  const [activeTab, setActiveTab] = useState<"vanilla" | "nexyn-cloud" | "nexyn-local">("nexyn-cloud");

  return (
    <div id="playground" className="w-full max-w-4xl mx-auto py-24 px-6 relative z-10 font-sans">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tighter mb-4">
          Integration Sandbox
        </h2>
        <p className="text-[#888888] font-normal">
          Compare native Cognee with Nexyn's Biological Pipeline.
        </p>
      </div>

      <div className="bg-[#0A0A0A] rounded-md border border-[#333333] overflow-hidden">
        {/* IDE Header */}
        <div className="flex items-center justify-between border-b border-[#333333] bg-[#0A0A0A] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("vanilla")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === "vanilla"
                  ? "bg-white text-black"
                  : "text-[#888888] hover:text-white"
                }`}
            >
              Native Cognee
            </button>
            <div className="flex bg-[#050505] rounded p-1 border border-[#333333]">
              <button
                onClick={() => setActiveTab("nexyn-cloud")}
                className={`px-3 py-1 rounded text-[10px] font-mono transition-colors flex items-center gap-2 ${activeTab === "nexyn-cloud"
                    ? "bg-[#333333] text-white"
                    : "text-[#888888] hover:text-white"
                  }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Nexyn (Cloud)
              </button>
              <button
                onClick={() => setActiveTab("nexyn-local")}
                className={`px-3 py-1 rounded text-[10px] font-mono transition-colors flex items-center gap-2 ${activeTab === "nexyn-local"
                    ? "bg-[#333333] text-white"
                    : "text-[#888888] hover:text-white"
                  }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Nexyn (Local)
              </button>
            </div>
          </div>
        </div>

        {/* IDE Editor Content */}
        <div className="relative h-[600px] bg-black p-6 font-mono text-[13px] leading-relaxed overflow-hidden">
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
                  <span className="text-[#888888]">{"// Without Nexyn: everything is stored permanently"}</span><br />
                  <span className="text-white">import</span> cognee<br />
                  <br />
                  <span className="text-[#888888]">{"// 1. Add memories blindly"}</span><br />
                  <span className="text-white">await</span> cognee.add(<span className="text-[#A1A1AA]">"User pasted a 500-page terms of service."</span>);<br />
                  <span className="text-white">await</span> cognee.add(<span className="text-[#A1A1AA]">"Doug is the groom."</span>);<br />
                  <br />
                  <span className="text-[#888888]">{"// 2. Compile knowledge graph"}</span><br />
                  <span className="text-white">await</span> cognee.cognify();<br />
                  <br />
                  <span className="text-[#888888]">{"// 3. Search triggers normal retrieval"}</span><br />
                  <span className="text-white">await</span> cognee.search(<span className="text-[#A1A1AA]">"Who is Doug?"</span>);<br />
                  <br />
                  <span className="text-[#888888]">{"// Result: The entire 500-page doc is permanently vectorized."}</span><br />
                  <span className="text-[#888888]">{"// Every future search drags this noise along with it."}</span><br />
                </div>
              </motion.div>
            ) : activeTab === "nexyn-cloud" ? (
              <motion.div
                key="nexyn-cloud"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-6"
              >
                <div className="text-[#A1A1AA]">
                  <span className="text-[#888888]">{"// With Nexyn: Biological Memory (Cognee Cloud)"}</span><br />
                  <span className="text-white">import</span> cognee<br />
                  <span className="text-white">import</span> nexyn<br />
                  <br />
                  <span className="text-[#888888]">{"// 1. Initialize Nexyn's cognitive layer for Cloud"}</span><br />
                  <span className="text-white">await</span> nexyn.inject(<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;nim_api_key=<span className="text-[#A1A1AA]">"nvapi-your-key-here"</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;cognee_api_key=<span className="text-[#A1A1AA]">"your_cognee_key"</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;cognee_url=<span className="text-[#A1A1AA]">"https://api.cognee.ai"</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;tenant_id=<span className="text-[#A1A1AA]">"default"</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;user_id=<span className="text-[#A1A1AA]">"user_123"</span><br />
                  )<br />
                  <br />
                  <span className="text-[#888888]">{"// 2. Add memories (Nexyn automatically evaluates Valence)"}</span><br />
                  <span className="text-white">await</span> cognee.add(<span className="text-[#A1A1AA]">"Doug is the groom."</span>); <span className="text-[#888888]">{"// Kept"}</span><br />
                  <span className="text-white">await</span> cognee.add(<span className="text-[#A1A1AA]">"User pasted a 500-page ToS."</span>); <span className="text-[#888888]">{"// Dropped"}</span><br />
                  <br />
                  <span className="text-[#888888]">{"// 3. Compile graph (Only high-valence data survives)"}</span><br />
                  <span className="text-white">await</span> cognee.cognify();<br />
                  <br />
                  <span className="text-[#888888]">{"// 4. Search triggers decay physics & memory rehearsal"}</span><br />
                  <span className="text-white">await</span> cognee.search(<span className="text-[#A1A1AA]">"Who is Doug?"</span>);<br />
                  <br />
                  <span className="text-[#888888]">{"// 5. Sweep permanently prunes dead memories"}</span><br />
                  <span className="text-white">await</span> nexyn.sweep();<br />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="nexyn-local"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-6"
              >
                <div className="text-[#A1A1AA]">
                  <span className="text-[#888888]">{"// With Nexyn: Biological Memory (Local Open Source)"}</span><br />
                  <span className="text-white">import</span> cognee<br />
                  <span className="text-white">import</span> nexyn<br />
                  <br />
                  <span className="text-[#888888]">{"// 1. Initialize Nexyn's cognitive layer for Local"}</span><br />
                  <span className="text-white">await</span> nexyn.inject(<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;nim_api_key=<span className="text-[#A1A1AA]">"nvapi-your-key-here"</span><br />
                  )<br />
                  <br />
                  <span className="text-[#888888]">{"// 2. Add memories (Nexyn automatically evaluates Valence)"}</span><br />
                  <span className="text-white">await</span> cognee.add(<span className="text-[#A1A1AA]">"Doug is the groom."</span>, dataset_name=<span className="text-[#A1A1AA]">"user_123"</span>); <span className="text-[#888888]">{"// Kept"}</span><br />
                  <span className="text-white">await</span> cognee.add(<span className="text-[#A1A1AA]">"User pasted a 500-page ToS."</span>, dataset_name=<span className="text-[#A1A1AA]">"user_123"</span>); <span className="text-[#888888]">{"// Dropped"}</span><br />
                  <br />
                  <span className="text-[#888888]">{"// 3. Compile graph (Only high-valence data survives)"}</span><br />
                  <span className="text-white">await</span> cognee.cognify();<br />
                  <br />
                  <span className="text-[#888888]">{"// 4. Search triggers decay physics & memory rehearsal"}</span><br />
                  <span className="text-white">await</span> cognee.search(<span className="text-[#A1A1AA]">"Who is Doug?"</span>);<br />
                  <br />
                  <span className="text-[#888888]">{"// 5. Sweep permanently prunes dead memories"}</span><br />
                  <span className="text-white">await</span> nexyn.sweep();<br />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
