"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Terminal, Star, GitFork, ArrowRight, Menu, X } from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function Navbar() {
  const [stars, setStars] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/Gitesh08/nexyn-core')
      .then(res => res.json())
      .then(data => {
        if (data && data.stargazers_count !== undefined) {
          setStars(data.stargazers_count.toString());
        }
      })
      .catch(console.error);
  }, []);


  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  };

  return (
    <motion.header 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 w-full border-b border-[#333333] bg-black/80 backdrop-blur-md"
    >
      <div className="flex h-20 items-center justify-between px-6 max-w-[1400px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/nexyn-logo.svg" alt="Nexyn" width={150} height={60} className="object-contain" />
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/documentation" className="text-[#A1A1AA] hover:text-white transition-colors">
              Documentation
            </Link>
            <a href="#blog" className="text-[#A1A1AA] hover:text-white transition-colors">
              Insights
            </a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3 md:border-l md:border-[#333333] md:pl-6">
            <a href="https://github.com/Gitesh08/nexyn-core" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded border border-[#333333] text-[#A1A1AA] hover:border-white hover:text-white transition-colors text-xs font-medium bg-transparent">
              <GithubIcon className="w-4 h-4" />
              <span className="hidden md:inline">Star</span>
              <span className="bg-[#333333] text-white px-1.5 py-0.5 rounded ml-1">{stars || "..."}</span>
            </a>
            
            <Link href="/demo" className="hidden sm:flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded bg-white text-black hover:bg-[#E5E5E5] transition-colors text-xs md:text-sm font-medium">
              Try Nexyn <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden flex items-center justify-center p-2 text-[#A1A1AA] hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[#333333] bg-[#0A0A0A] px-6 py-4 flex flex-col gap-4"
          >
            <Link 
              href="/documentation" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium"
            >
              Documentation
            </Link>
            <a 
              href="#blog" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium"
            >
              Insights
            </a>
            <a 
              href="https://github.com/Gitesh08/nexyn-core" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex sm:hidden items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors text-sm font-medium"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Star on GitHub ({stars || "..."})</span>
            </a>
            <Link 
              href="/demo" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex sm:hidden items-center justify-center gap-2 w-full py-2 rounded bg-white text-black hover:bg-[#E5E5E5] transition-colors text-sm font-medium"
            >
              Try Nexyn <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
