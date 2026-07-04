"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, BookOpen, Layers, Zap, Code, Shield, BrainCircuit, Database, Cpu, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("remember");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["introduction", "cognee_architecture", "the_four_layers", "api_wrapper", "nvidia_nim", "usage_guide"];
      let currentSection = sections[0];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: "introduction", label: "Introduction", icon: BookOpen },
    { id: "cognee_architecture", label: "Cognee Architecture", icon: Database },
    { id: "the_four_layers", label: "The Four Layers", icon: Layers },
    { id: "api_wrapper", label: "The API Wrapper", icon: Code },
    { id: "nvidia_nim", label: "Nvidia Engine", icon: Cpu },
    { id: "usage_guide", label: "Usage Guide", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#A1A1AA] font-sans selection:bg-[#3b82f6] selection:text-white flex flex-col relative pt-20">
      
      {/* Mobile Header Menu Toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-4 bg-white text-black rounded-full shadow-2xl flex items-center justify-center"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="lg:hidden fixed inset-x-4 bottom-24 bg-[#111111] border border-[#333333] rounded-2xl shadow-2xl p-6 z-50 flex flex-col gap-4"
          >
            <h3 className="text-white font-semibold mb-2">Navigation</h3>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all ${
                  activeSection === item.id 
                    ? "bg-[#3b82f6]/10 text-[#3b82f6] font-medium" 
                    : "hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex w-full max-w-[1600px] mx-auto relative flex-1">
        
        {/* Left Sidebar Navigation */}
        <aside className="hidden lg:flex w-72 flex-col fixed top-20 bottom-0 overflow-y-auto border-r border-[#1A1A1A] bg-[#0A0A0A] py-10 pl-8 pr-6 z-10">
          <h2 className="text-white text-sm font-semibold tracking-wider uppercase mb-8 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3b82f6]" />
            Documentation
          </h2>
          <nav className="flex flex-col gap-2 relative">
            
            {/* Active Indicator Line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-[#1A1A1A] -z-10" />
            
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`flex items-center gap-4 text-left py-2.5 px-3 rounded-lg transition-all group ${
                    isActive 
                      ? "text-[#3b82f6] font-medium bg-[#3b82f6]/5" 
                      : "text-[#888888] hover:text-white hover:bg-[#111111]"
                  }`}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-md bg-[#0A0A0A] border transition-colors ${
                    isActive ? "border-[#3b82f6] text-[#3b82f6]" : "border-[#1A1A1A] text-[#555555] group-hover:border-[#333333] group-hover:text-white"
                  }`}>
                    {isActive ? <ChevronRight className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 xl:mr-72 min-w-0 px-6 sm:px-12 lg:px-24 py-16 pb-32">
          
          <div className="max-w-3xl mx-auto flex flex-col gap-24">
            
            {/* Introduction Section */}
            <section id="introduction" className="scroll-mt-32">
              <div className="inline-block px-3 py-1 bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-semibold tracking-wider uppercase rounded-full mb-6">
                Overview
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
                Welcome to Nexyn
              </h1>
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-p:text-[#A1A1AA] prose-headings:text-white prose-a:text-[#3b82f6]">
                <p>
                  Most artificial intelligence memory systems suffer from a major problem. They remember everything forever. Over time, their memory databases become bloated with useless information. This causes slow retrieval times, high computing costs, and poor context quality. 
                </p>
                <p>
                  Project Nexyn fixes this problem by mimicking the human brain. We built an intelligent engine that actively learns how to forget. By filtering and naturally decaying low value data, your knowledge graph remains incredibly fast and highly optimized at all times.
                </p>
              </div>
            </section>

            {/* Cognee Architecture Section */}
            <section id="cognee_architecture" className="scroll-mt-32">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-8 pb-4 border-b border-[#1A1A1A]">
                The Cognee Architecture
              </h2>
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-p:text-[#A1A1AA]">
                <p>
                  At the core of Project Nexyn lies Cognee. Cognee is a state of the art graph vector database designed for permanent memory retention. However, raw memory without curation eventually turns into noise. We utilized Cognee as the bedrock storage layer, treating it as the long term permanent memory bank. 
                </p>
                
                {/* Visual Pipeline */}
                <div className="my-12 p-8 bg-[#111111] border border-[#1A1A1A] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-x-auto shadow-2xl">
                  <div className="flex flex-col items-center gap-3 min-w-[120px]">
                    <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center shadow-lg">
                      <Zap className="w-6 h-6 text-[#A1A1AA]" />
                    </div>
                    <span className="text-sm font-medium text-white">Raw Input</span>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-center">
                    <ArrowRight className="w-6 h-6 text-[#333333]" />
                  </div>
                  
                  <div className="flex flex-col items-center gap-3 min-w-[120px]">
                    <div className="w-16 h-16 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      <BrainCircuit className="w-6 h-6 text-[#3b82f6]" />
                    </div>
                    <span className="text-sm font-medium text-[#3b82f6]">Nexyn Filter</span>
                  </div>

                  <div className="hidden md:flex flex-col items-center">
                    <ArrowRight className="w-6 h-6 text-[#333333]" />
                  </div>

                  <div className="flex flex-col items-center gap-3 min-w-[120px]">
                    <div className="w-16 h-16 rounded-full bg-[#eab308]/10 border border-[#eab308]/30 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Database className="w-6 h-6 text-[#eab308]" />
                    </div>
                    <span className="text-sm font-medium text-[#eab308]">Cognee Graph</span>
                  </div>
                </div>

                <p>
                  Instead of blindly injecting every incoming message into Cognee, Nexyn acts as an intelligent shield. It intercepts the data, evaluates it, and only forwards the most critical knowledge to the Cognee cloud using strict application programming interfaces. 
                </p>
              </div>
            </section>

            {/* The Four Layers Section */}
            <section id="the_four_layers" className="scroll-mt-32">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-10 pb-4 border-b border-[#1A1A1A]">
                The Four Layers
              </h2>
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-p:text-[#A1A1AA]">
                <p className="mb-12">
                  We designed Nexyn using four distinct cognitive layers based on human psychology and ancient philosophy. Each layer performs a specialized function in the memory lifecycle.
                </p>

                <div className="flex flex-col gap-12">
                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-8 hover:border-[#333333] transition-colors shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                        1
                      </div>
                      <h3 className="text-2xl font-semibold text-white m-0">Sensory Buffer</h3>
                    </div>
                    <p className="m-0 text-[#A1A1AA] leading-relaxed">
                      This is the first point of contact for all incoming data. Just like your eyes and ears take in huge amounts of raw data every second, this layer briefly holds all new information. It temporarily stores documents, chat logs, and system events before passing them securely to the next stage.
                    </p>
                  </div>

                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-8 hover:border-[#333333] transition-colors shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                        2
                      </div>
                      <h3 className="text-2xl font-semibold text-white m-0">Evaluator</h3>
                    </div>
                    <p className="m-0 text-[#A1A1AA] leading-relaxed">
                      This layer acts as the active intellect of the system. It uses an advanced language model to analyze every piece of data from the sensory buffer. It assigns a valence score based on relevance, emotional weight, and structural importance. Highly important data gets a high score. Useless chatter gets a low score.
                    </p>
                  </div>

                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-8 hover:border-[#333333] transition-colors shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-[#3b82f6] text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        3
                      </div>
                      <h3 className="text-2xl font-semibold text-white m-0">Memory Consolidator</h3>
                    </div>
                    <p className="m-0 text-[#A1A1AA] leading-relaxed">
                      Once the data is scored, this layer decides its fate. High scoring data is permanently integrated into the core knowledge graph. This ensures critical facts are never lost. Low scoring data remains in temporary storage where it will naturally fade away.
                    </p>
                  </div>

                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-8 hover:border-[#333333] transition-colors shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                        4
                      </div>
                      <h3 className="text-2xl font-semibold text-white m-0">Ego Decay</h3>
                    </div>
                    <p className="m-0 text-[#A1A1AA] leading-relaxed">
                      Just like human memory fades over time if not accessed, this final layer continuously prunes the system. It routinely scans the temporary storage and permanently deletes data that has decayed past the acceptable threshold. This guarantees that your vector database remains fast, clean, and highly optimized.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* The API Wrapper Section */}
            <section id="api_wrapper" className="scroll-mt-32">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-8 pb-4 border-b border-[#1A1A1A]">
                The API Wrapper Explained
              </h2>
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-p:text-[#A1A1AA] mb-10">
                <p>
                  To interact with the Cognee cloud securely and efficiently, we built a dedicated Python wrapper. This wrapper normalizes data payloads, gracefully handles cloud tenant limits, and securely orchestrates graph operations without crashing the host application.
                </p>
                <p>
                  Explore the interactive tabs below to see exactly how our codebase interfaces with the Cognee endpoints in real time.
                </p>
              </div>

              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A] bg-[#0A0A0A] overflow-x-auto">
                  {['add', 'cognify', 'search', 'sweep'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-[#888888] hover:text-white hover:bg-[#1A1A1A]"
                      }`}
                    >
                      {tab === 'sweep' ? 'nexyn.sweep()' : `cognee.${tab}()`}
                    </button>
                  ))}
                </div>
                <div className="p-6 font-mono text-sm text-[#A1A1AA] overflow-x-auto bg-[#050505] min-h-[200px] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      {activeTab === 'add' && (
                        <pre className="m-0 leading-relaxed"><code>{`async def add(data: Any, *args, **kwargs):
    """
    Intercepts cognee.add() to route data through the Sensory Buffer 
    and evaluate its Valence before permanent storage.
    """
    payload = NormalizedPayload(text=data, ...)
    await eval_engine.evaluate(payload)
    
    # If high valence, proceeds to native Cognee storage
    return await original_add(data, *args, **kwargs)`}</code></pre>
                      )}
                      {activeTab === 'cognify' && (
                        <pre className="m-0 leading-relaxed"><code>{`async def cognify(*args, **kwargs):
    """
    Triggers the cognitive graph building process. 
    Nexyn intercepts this purely to log the state transition,
    allowing Cognee to permanently encode the high-valence memories.
    """
    return await original_cognify(*args, **kwargs)`}</code></pre>
                      )}
                      {activeTab === 'search' && (
                        <pre className="m-0 leading-relaxed"><code>{`async def search(query_text: str, *args, **kwargs) -> list[dict]:
    """
    Searches the graph. Nexyn intercepts to apply decay physics, 
    filter out forgotten nodes, and trigger 'rehearsal' (strengthening
    the memory weight of accessed nodes).
    """
    req = RecallRequest(query=query_text)
    result = await retrieval_engine.recall(req)
    return [match.dict() for match in result.matches]`}</code></pre>
                      )}
                      {activeTab === 'sweep' && (
                        <pre className="m-0 leading-relaxed"><code>{`async def sweep():
    """
    Nexyn-specific background consolidation process.
    Fast-forwards time, decaying all memory weights and permanently
    deleting nodes from Cognee that have fallen below the survival threshold.
    """
    await consolidation_engine.sweep_once(...)`}</code></pre>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </section>

            {/* Nvidia NIM Section */}
            <section id="nvidia_nim" className="scroll-mt-32">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-8 pb-4 border-b border-[#1A1A1A]">
                Nvidia Inference Integration
              </h2>
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-p:text-[#A1A1AA]">
                <p>
                  The deep intelligence behind the Evaluator layer is powered directly by Nvidia microservices. By utilizing the highly optimized language models hosted natively on Nvidia architecture, Nexyn achieves lightning fast inference speeds capable of handling massive data throughput. 
                </p>
                <div className="bg-[#111111] border-l-4 border-[#76b900] p-6 rounded-r-xl my-10 shadow-lg">
                  <h4 className="text-[#76b900] font-bold text-lg mb-3 flex items-center gap-2">
                    <Cpu className="w-5 h-5" /> Ultra Low Latency Valuations
                  </h4>
                  <p className="m-0 text-[15px] leading-relaxed">
                    Memory evaluation happens inline before data ever reaches the permanent database. This requires near zero latency. The Nvidia inference endpoints allow us to compute valence scores in milliseconds, ensuring the data ingestion pipeline never bottlenecks.
                  </p>
                </div>
              </div>
            </section>

            {/* Usage Guide Section */}
            <section id="usage_guide" className="scroll-mt-32">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-8 pb-4 border-b border-[#1A1A1A]">
                Usage Guide
              </h2>
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-p:text-[#A1A1AA]">
                <p className="mb-10">
                  Getting started is incredibly simple. Our system runs locally and connects directly to your applications with minimal setup required.
                </p>

                <div className="space-y-12">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Step One: Installation</h3>
                    <p className="mb-4">
                      Install the package via your preferred package manager. Ensure you have Python installed on your machine.
                    </p>
                    <div className="bg-[#050505] border border-[#1A1A1A] rounded-lg p-5 font-mono text-sm flex flex-col gap-3">
                      <div>
                        <span className="text-[#555555] block mb-1"># Standard installation</span>
                        <span className="text-white">pip install nexyn-core</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Step Two: Configuration</h3>
                    <p>
                      Navigate to the web dashboard and click the settings icon located near the title. Enter your Nvidia API key and Cognee API key. The system will securely save these credentials and instantly connect to the processing servers in the background.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Step Three: Integration</h3>
                    <p className="mb-6">
                      Send data directly to the ingest endpoints. The biomimetic engine will automatically score the data and route it through the four cognitive layers. You can easily monitor the real time status of your memory graph through the live dashboard.
                    </p>
                    <div className="bg-[#050505] border border-[#1A1A1A] rounded-lg p-6 font-mono text-sm overflow-x-auto">
                      <pre className="text-[#A1A1AA] m-0"><code>{`import asyncio
import cognee
import nexyn

async def main():
    # 1. Initialize Nexyn's cognitive layer
    await nexyn.inject(
        nim_api_key="nvapi-your-key-here", 
        cognee_api_key="your_cognee_api_key",
        cognee_url="https://api.cognee.ai",
        tenant_id="default",
        user_id="user_123"
    )

    # 2. Add memories normally (Nexyn automatically scores Valence)
    await cognee.add("Doug is the groom. The wedding is Sunday.")
    
    # 3. Compile the Cognee knowledge graph
    await cognee.cognify()
    
    # 4. Search triggers decay physics and memory rehearsal
    results = await cognee.search("Where is Doug?")
    
    # 5. Fast-forward time to prune dead memories
    await nexyn.sweep()

if __name__ == "__main__":
    asyncio.run(main())`}</code></pre>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Right Sidebar TOC */}
        <aside className="hidden xl:flex w-72 flex-col fixed top-20 bottom-0 right-0 overflow-y-auto pl-6 pr-8 py-10 z-10">
          <h4 className="text-white text-xs font-semibold tracking-widest uppercase mb-6">
            On This Page
          </h4>
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-left text-sm transition-colors ${
                  activeSection === item.id ? "text-[#3b82f6] font-medium" : "text-[#888888] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
