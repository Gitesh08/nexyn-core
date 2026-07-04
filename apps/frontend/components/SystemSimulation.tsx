"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Terminal, Network } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { id: string; text: string; sender: "user" | "system" };
type ViewMode = "code" | "graph";

function CanvasGraph({ msgCount }: { msgCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // We keep the nodes in a mutable ref so the canvas loop runs entirely outside React render cycle
  const nodesRef = useRef<{x: number, y: number, vx: number, vy: number}[]>([]);

  // When msgCount changes, or on mount, ensure we have the correct total nodes
  useEffect(() => {
    const targetNodeCount = msgCount * 15;
    const currentCount = nodesRef.current.length;
    
    if (targetNodeCount > currentCount) {
      const newNodes = Array.from({ length: targetNodeCount - currentCount }, () => ({
        x: Math.random() * (canvasRef.current?.width || 400),
        y: Math.random() * (canvasRef.current?.height || 400),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      }));
      nodesRef.current = [...nodesRef.current, ...newNodes];
    }
  }, [msgCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nodes = nodesRef.current;

      // Update positions
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce
        if (n.x <= 0 || n.x >= canvas.width) n.vx *= -1;
        if (n.y <= 0 || n.y >= canvas.height) n.vy *= -1;
      }

      // Draw connections (simulate context bloat by drawing many lines)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = dx * dx + dy * dy;
          
          if (dist < 8000) {
            ctx.strokeStyle = `rgba(226, 184, 117, ${1 - dist / 8000})`; // Golden Aura
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      ctx.fillStyle = "#E2B875";
      for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#070A13]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 left-4 p-3 rounded-md bg-[#070A13]/80 border border-[#384A6E]/50 backdrop-blur-sm z-10">
        <div className="text-xs font-mono text-[#94A3B8] flex flex-col gap-1">
          <div className="flex justify-between gap-4">
            <span>Total Graph Nodes:</span>
            <span className="text-[#E2B875]">{nodesRef.current.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Context Token Bloat Weight:</span>
            <span className="text-red-400">{(nodesRef.current.length * 14.3).toFixed(1)}k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SystemSimulation() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello AI!", sender: "user" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [logs, setLogs] = useState<React.ReactNode[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
  }, [logs]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    
    // Simulate Cognee APIs firing sequence
    setTimeout(() => setLogs(l => [...l, `> Incoming message received: "${userMsg.text}"`]), 100);
    setTimeout(() => setLogs(l => [...l, <span key={Date.now()} className="text-[#E2B875]">{`> [1/3] await `}<span className="text-white font-mono font-bold">cognee.remember</span>{`(data, "user_chat")`}</span>]), 400);
    setTimeout(() => setLogs(l => [...l, <span key={Date.now()+1} className="text-[#E2B875]">{`> [2/3] await `}<span className="text-white font-mono font-bold">cognee.remember</span>{`() // Generating embeddings and graph...`}</span>]), 800);
    setTimeout(() => setLogs(l => [...l, <span key={Date.now()+2} className="text-[#E2B875]">{`> [3/3] await `}<span className="text-white font-mono font-bold">cognee.recall</span>{`("user_chat") // Pulling entire massive cluster...`}</span>]), 1400);

    // Simulate generic AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: "I have recorded that.", sender: "system" }]);
    }, 1800);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-24 px-6 relative z-10 font-sans">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-semibold text-[#F8FAFC] tracking-tight mb-4">
          The System Simulation Chambers
        </h2>
        <p className="text-[#94A3B8] max-w-2xl mx-auto tracking-wide font-light">
          Visualizing the "Hoarder AI" problem. Trivial data explodes context weight in standard ingestion architectures.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* ROW 1: Vanilla Cognee Application */}
        <div className="flex flex-col mb-4">
          <h3 className="text-sm font-semibold text-[#E2B875] tracking-widest uppercase mb-4 pl-2 border-l-2 border-[#E2B875]">
            Row 1: Vanilla Ingestion (Hoarder AI)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
            
            {/* LEFT SIDE: Mock Chat UI */}
            <div className="flex flex-col bg-[#05070A] border border-[#384A6E]/30 rounded-xl overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-[#384A6E]/10 border-b border-[#384A6E]/30">
                <span className="text-sm font-medium text-[#F8FAFC]">Chat Interface</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3" ref={scrollRef}>
                {messages.map(msg => (
                  <div key={msg.id} className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === "user" ? "bg-[#384A6E]/20 text-white self-end rounded-tr-none" : "bg-[#070A13] border border-[#384A6E]/30 text-[#94A3B8] self-start rounded-tl-none"}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-[#070A13] border-t border-[#384A6E]/30 flex items-center gap-2">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a trivial message..." 
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#384A6E] focus:outline-none px-2"
                />
                <button 
                  onClick={handleSend}
                  className="p-2 bg-[#E2B875] hover:bg-[#D4A962] text-[#070A13] rounded-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Visualizer Toggle Panel */}
            <div className="flex flex-col bg-[#05070A] border border-[#384A6E]/30 rounded-xl overflow-hidden shadow-xl">
              <div className="px-4 py-2 bg-[#384A6E]/10 border-b border-[#384A6E]/30 flex gap-2">
                <button 
                  onClick={() => setViewMode("code")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${viewMode === "code" ? "bg-[#384A6E]/30 text-white" : "text-[#94A3B8] hover:text-white"}`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Live Code Screen
                </button>
                <button 
                  onClick={() => setViewMode("graph")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${viewMode === "graph" ? "bg-[#384A6E]/30 text-white" : "text-[#94A3B8] hover:text-white"}`}
                >
                  <Network className="w-3.5 h-3.5" />
                  Graph Visualizer
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {viewMode === "code" ? (
                    <motion.div 
                      key="code"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 p-4 overflow-y-auto bg-[#070A13] font-mono text-xs text-[#94A3B8]"
                      ref={logScrollRef}
                    >
                      {logs.length === 0 && <span className="opacity-50">Waiting for input to trigger ingestion cycle...</span>}
                      {logs.map((log, i) => (
                        <div key={i} className="mb-2">
                          {log}
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="graph"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0"
                    >
                      <CanvasGraph msgCount={messages.length} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* ROW 2: Project Nexyn Wrapper (Placeholders) */}
        <div className="flex flex-col mt-8">
          <h3 className="text-sm font-semibold text-[#E2B875] tracking-widest uppercase mb-4 pl-2 border-l-2 border-[#E2B875]">
            Row 2: Project Nexyn Integration
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[300px]">
            {/* Box 1 */}
            <div className="border-2 border-dashed border-[#384A6E]/50 rounded-xl bg-[#384A6E]/5 flex items-center justify-center p-6 text-center">
              <span className="text-[#94A3B8] text-sm tracking-widest font-mono">
                NEXYN LAYER ACTIVE WRAPPER INTEGRATION
                <br /><br />
                <span className="text-[#384A6E] font-semibold opacity-70">PENDING DISCOVERY PHASE</span>
              </span>
            </div>
            
            {/* Box 2 */}
            <div className="border-2 border-dashed border-[#384A6E]/50 rounded-xl bg-[#384A6E]/5 flex items-center justify-center p-6 text-center">
              <span className="text-[#94A3B8] text-sm tracking-widest font-mono">
                NEXYN LAYER ACTIVE WRAPPER INTEGRATION
                <br /><br />
                <span className="text-[#384A6E] font-semibold opacity-70">PENDING DISCOVERY PHASE</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
