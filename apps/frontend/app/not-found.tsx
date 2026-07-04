"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, Home, Activity } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <BrainCircuit className="w-24 h-24 text-[#333333]" />
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 text-purple-500"
            >
              <BrainCircuit className="w-24 h-24" />
            </motion.div>
          </div>
        </div>

        <h1 className="text-6xl font-bold text-white tracking-tighter mb-4">404</h1>
        <h2 className="text-xl font-medium text-[#E5E5E5] mb-4 tracking-tight">Memory Trace Not Found</h2>
        
        <p className="text-[#888888] text-sm mb-12 max-w-md mx-auto">
          The neural pathway you're trying to access doesn't exist or has been pruned from the registry. 
          Let's get you back to familiar territory.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <button className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-[#E5E5E5] transition-colors rounded-md text-sm font-medium flex items-center justify-center gap-2 group">
              <Home className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
              Return Home
            </button>
          </Link>
          
          <Link href="/demo">
            <button className="w-full sm:w-auto px-6 py-3 bg-[#111111] border border-[#333333] hover:border-[#555555] text-white transition-all rounded-md text-sm font-medium flex items-center justify-center gap-2 group">
              <Activity className="w-4 h-4 text-[#A1A1AA] group-hover:text-white transition-colors" />
              Internals Dashboard
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
