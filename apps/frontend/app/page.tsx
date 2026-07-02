import { ValenceMatrix } from "@/components/ValenceMatrix";
import { CodePlayground } from "@/components/CodePlayground";
import { CognitivePipeline } from "@/components/CognitivePipeline";
import { TeamSection } from "@/components/TeamSection";
import { HeroSimulation } from "@/components/HeroSimulation";
import { FAQSection } from "@/components/FAQSection";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-black min-h-[calc(100vh-5rem)]">
      {/* Hero & Live Simulation Hook */}
      <HeroSimulation />

      {/* Feature Sections */}
      <div className="flex flex-col gap-12 pb-12 relative z-10 mt-12">
        <ScrollReveal>
          <CognitivePipeline />
        </ScrollReveal>
        <ScrollReveal>
          <ValenceMatrix />
        </ScrollReveal>
        <ScrollReveal>
          <CodePlayground />
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>

      {/* Footer / Team Section */}
      <ScrollReveal>
        <TeamSection />
      </ScrollReveal>
    </main>
  );
}
