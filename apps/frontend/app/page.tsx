"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ValenceMatrix } from "@/components/ValenceMatrix";
import { CodePlayground } from "@/components/CodePlayground";
import { CognitivePipeline } from "@/components/CognitivePipeline";
import { TeamSection } from "@/components/TeamSection";
import { HeroSimulation } from "@/components/HeroSimulation";
import { FAQSection } from "@/components/FAQSection";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/Footer";
import { BlogSection } from "@/components/BlogSection";

export default function Home() {
  const [heroDone, setHeroDone] = useState(false);

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-black min-h-[calc(100vh-5rem)]">
      {/* Hero & Live Simulation Hook */}
      <HeroSimulation onComplete={() => setHeroDone(true)} />

      <AnimatePresence>
        {heroDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col gap-12 pb-12 relative z-10 mt-12"
          >
            <ScrollReveal>
              <CognitivePipeline />
            </ScrollReveal>
            <ScrollReveal>
              <ValenceMatrix />
            </ScrollReveal>
            <ScrollReveal>
              <CodePlayground />
            </ScrollReveal>

            <ScrollReveal>
              <FAQSection />
            </ScrollReveal>

            <ScrollReveal>
              <BlogSection />
            </ScrollReveal>

            {/* Footer / Team Section */}
            <ScrollReveal>
              <TeamSection />
            </ScrollReveal>
            
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
