"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function BlogSection() {
  return (
    <div id="blog" className="w-full max-w-5xl mx-auto pt-24 pb-12 px-6 relative z-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-[#333333] pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tighter mb-2">
            Latest Insights
          </h2>
          <p className="text-[#888888] font-normal text-sm">
            Deep dives into biomimetic AI architecture.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.a
          href="https://medium.com/@gitesh08/nexyn-teaching-ai-to-forget-so-it-can-actually-remember-c5ba0027657b"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group block"
        >
          <div className="relative flex flex-col md:flex-row bg-[#0A0A0A] border border-[#333333] rounded-xl group-hover:border-white transition-colors duration-300 overflow-hidden">
            
            {/* Visual Teaser */}
            <div className="w-full md:w-64 h-48 md:h-auto bg-[#111111] border-b md:border-b-0 md:border-r border-[#333333] flex items-center justify-center relative overflow-hidden group-hover:bg-[#1a1a1a] transition-colors duration-500">
              <img 
                src="https://res.cloudinary.com/db7h39kx9/image/upload/v1783248039/nexyn-logo_a3znlo.png" 
                alt="Nexyn Cover"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
              />
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-[#111111] border border-[#333333] text-[10px] uppercase tracking-widest text-[#A1A1AA] font-medium">
                    Medium
                  </span>
                  <span className="text-xs text-[#555555] font-mono">July 2026</span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-3 group-hover:text-blue-400 transition-colors">
                  Nexyn: Teaching AI to forget, so it can actually remember.
                </h3>
                
                <p className="text-[#888888] text-sm leading-relaxed mb-6 max-w-2xl">
                  An exploration into why LLMs suffer from context bloat and how we can apply biological memory decay and instinct consolidation to keep vector graphs lean, fast, and intelligent.
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#111111] overflow-hidden border border-[#333333]">
                    <img 
                      src="https://res.cloudinary.com/db7h39kx9/image/upload/v1783226970/hero-image_xcgdmw.png" 
                      alt="Gitesh Mahadik"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#E5E5E5]">Gitesh Mahadik</span>
                    <span className="text-[10px] text-[#555555]">Author</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                  Read Article
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

          </div>
        </motion.a>
      </div>
    </div>
  );
}
