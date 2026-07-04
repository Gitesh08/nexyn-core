"use client";

import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

export function ArchitecturalComparison() {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const leftCounterRef = useRef<HTMLDivElement>(null);
  const rightCounterRef = useRef<HTMLDivElement>(null);

  const [isInjecting, setIsInjecting] = useState(false);

  const stateRef = useRef({
    isInjecting: false,
    leftTokens: 45021,
    rightTokens: 1024,
    leftParticles: [] as {x: number, y: number, vx: number, vy: number}[],
    leftCenterRadius: 20,
    rightParticles: [] as {x: number, y: number, vx: number, vy: number, isHighValue: boolean, state: "flying" | "filtered" | "locked", scale: number, targetAngle: number}[],
  });

  useEffect(() => {
    stateRef.current.isInjecting = isInjecting;
  }, [isInjecting]);

  useEffect(() => {
    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    if (!leftCanvas || !rightCanvas) return;

    const ctxL = leftCanvas.getContext("2d");
    const ctxR = rightCanvas.getContext("2d");
    if (!ctxL || !ctxR) return;

    const resize = () => {
      leftCanvas.width = leftCanvas.offsetWidth;
      leftCanvas.height = leftCanvas.offsetHeight;
      rightCanvas.width = rightCanvas.offsetWidth;
      rightCanvas.height = rightCanvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animationId: number;

    const render = () => {
      const state = stateRef.current;
      const wL = leftCanvas.width;
      const hL = leftCanvas.height;
      const wR = rightCanvas.width;
      const hR = rightCanvas.height;

      ctxL.clearRect(0, 0, wL, hL);
      ctxR.clearRect(0, 0, wR, hR);

      // --- INJECTION LOGIC ---
      if (state.isInjecting) {
        // Inject left (Hoarder)
        if (Math.random() > 0.1) {
          state.leftParticles.push({
            x: Math.random() < 0.5 ? 0 : wL,
            y: Math.random() * hL,
            vx: 0, vy: 0
          });
        }
        // Inject right (Nexyn)
        if (Math.random() > 0.1) {
          state.rightParticles.push({
            x: 0,
            y: (Math.random() - 0.5) * hR * 0.8 + hR / 2,
            vx: 0, vy: 0,
            isHighValue: Math.random() > 0.7, // 30% pass
            state: "flying",
            scale: 1,
            targetAngle: Math.random() * Math.PI * 2
          });
        }
      } else {
        // Slow natural decay of bloat if not injecting just to keep it alive
        if (state.leftCenterRadius > 20) state.leftCenterRadius -= 0.05;
      }

      // --- LEFT CANVAS RENDER (Vanilla Bloat) ---
      const centerX = wL / 2;
      const centerY = hL / 2;
      
      ctxL.fillStyle = "rgba(239, 68, 68, 0.8)";
      for (let i = state.leftParticles.length - 1; i >= 0; i--) {
        const p = state.leftParticles[i];
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        p.vx += (dx / dist) * 0.5;
        p.vy += (dy / dist) * 0.5;
        p.vx *= 0.95;
        p.vy *= 0.95;
        
        p.x += p.vx;
        p.y += p.vy;

        ctxL.beginPath();
        ctxL.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctxL.fill();

        if (dist < state.leftCenterRadius) {
          state.leftParticles.splice(i, 1);
          state.leftCenterRadius = Math.min(state.leftCenterRadius + 0.5, wL / 2.5);
          state.leftTokens += Math.floor(Math.random() * 15 + 5);
        }
      }

      // Draw left bloated center
      ctxL.beginPath();
      ctxL.arc(centerX, centerY, state.leftCenterRadius, 0, Math.PI * 2);
      ctxL.fillStyle = `rgba(239, 68, 68, ${0.3 + (state.leftCenterRadius / wL)})`;
      ctxL.fill();
      ctxL.lineWidth = 2;
      ctxL.strokeStyle = "rgba(239, 68, 68, 0.8)";
      ctxL.stroke();

      // --- RIGHT CANVAS RENDER (Nexyn Pruning) ---
      const filterX = wR * 0.4;
      const coreX = wR * 0.75;
      const coreY = hR / 2;

      // Draw filter line
      ctxR.beginPath();
      ctxR.moveTo(filterX, 0);
      ctxR.lineTo(filterX, hR);
      ctxR.strokeStyle = "rgba(139, 92, 246, 0.3)"; // Purple filter
      ctxR.lineWidth = 2;
      ctxR.stroke();
      
      // Draw sacred geometry core
      ctxR.beginPath();
      const numPoints = 6;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 + Date.now() * 0.0005;
        const x = coreX + Math.cos(angle) * 30;
        const y = coreY + Math.sin(angle) * 30;
        if (i === 0) ctxR.moveTo(x, y);
        else ctxR.lineTo(x, y);
      }
      ctxR.closePath();
      ctxR.strokeStyle = "rgba(226, 184, 117, 0.8)"; // Golden Aura
      ctxR.lineWidth = 1;
      ctxR.stroke();

      for (let i = state.rightParticles.length - 1; i >= 0; i--) {
        const p = state.rightParticles[i];
        
        if (p.state === "flying") {
          p.vx = 4;
          p.x += p.vx;
          
          if (p.x >= filterX) {
            if (p.isHighValue) {
              p.state = "locked";
            } else {
              p.state = "filtered";
            }
          }
        } else if (p.state === "filtered") {
          p.vy += 0.2; // Fall
          p.y += p.vy;
          p.scale *= 0.9; // Shrink
          if (p.scale < 0.05) {
            state.rightParticles.splice(i, 1);
            continue;
          }
        } else if (p.state === "locked") {
          const targetX = coreX + Math.cos(p.targetAngle) * 30;
          const targetY = coreY + Math.sin(p.targetAngle) * 30;
          p.x += (targetX - p.x) * 0.1;
          p.y += (targetY - p.y) * 0.1;
          
          if (Math.abs(targetX - p.x) < 1 && Math.abs(targetY - p.y) < 1) {
             state.rightTokens += (state.rightTokens < 1024 ? 1 : 0); // Stays stable around 1024
             state.rightParticles.splice(i, 1);
             continue;
          }
        }

        ctxR.beginPath();
        ctxR.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
        if (p.state === "filtered") {
          ctxR.fillStyle = `rgba(71, 85, 105, ${p.scale})`; // Grey
        } else {
          ctxR.fillStyle = p.isHighValue ? "rgba(226, 184, 117, 1)" : "rgba(14, 165, 233, 1)"; // Gold/Blue
        }
        ctxR.fill();
      }

      // --- DOM UPDATES ---
      if (leftCounterRef.current) {
        leftCounterRef.current.innerText = state.leftTokens.toLocaleString();
      }
      if (rightCounterRef.current) {
        rightCounterRef.current.innerText = state.rightTokens.toLocaleString();
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
    <div className="w-full max-w-6xl mx-auto py-24 px-6 relative z-10 font-sans">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-semibold text-[#F8FAFC] tracking-tight mb-4">
          Architectural Comparison
        </h2>
        <p className="text-[#94A3B8] max-w-2xl mx-auto tracking-wide font-light">
          Watch the catastrophic difference between standard ingestion pipelines and synaptic valency routing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* LEFT: Problem */}
        <div className="flex flex-col bg-[#05070A] rounded-2xl border border-[#384A6E]/30 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-[#384A6E]/10 border-b border-[#384A6E]/30">
            <h3 className="text-[#F8FAFC] font-semibold text-lg">The Problem: Infinite Bloat</h3>
            <p className="text-[#94A3B8] text-xs mt-1">Vanilla Cognee Hoarder Architecture</p>
          </div>
          <div className="relative h-[300px] w-full">
            <canvas ref={leftCanvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-4 left-4 p-3 rounded-lg bg-[#070A13]/80 border border-[#384A6E]/30 backdrop-blur-md">
              <span className="text-xs text-[#94A3B8] uppercase tracking-wider font-semibold">Context Tokens</span>
              <div className="text-2xl font-mono text-red-400 mt-1" ref={leftCounterRef}>
                45,021
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Solution */}
        <div className="flex flex-col bg-[#05070A] rounded-2xl border border-[#384A6E]/30 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-[#384A6E]/10 border-b border-[#384A6E]/30">
            <h3 className="text-[#F8FAFC] font-semibold text-lg">The Solution: Organic Pruning</h3>
            <p className="text-[#94A3B8] text-xs mt-1">Project Nexyn Valency Engine</p>
          </div>
          <div className="relative h-[300px] w-full">
            <canvas ref={rightCanvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-4 left-4 p-3 rounded-lg bg-[#070A13]/80 border border-[#384A6E]/30 backdrop-blur-md">
              <span className="text-xs text-[#94A3B8] uppercase tracking-wider font-semibold">Context Tokens</span>
              <div className="text-2xl font-mono text-[#E2B875] mt-1" ref={rightCounterRef}>
                1,024
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTION BUTTON */}
      <div className="flex justify-center">
        <button 
          onMouseDown={() => setIsInjecting(true)}
          onMouseUp={() => setIsInjecting(false)}
          onMouseLeave={() => setIsInjecting(false)}
          onTouchStart={() => setIsInjecting(true)}
          onTouchEnd={() => setIsInjecting(false)}
          className={`relative overflow-hidden group px-10 py-4 rounded-full font-bold tracking-wide transition-all duration-300 ${isInjecting ? "bg-red-500 text-white scale-95 shadow-[0_0_40px_rgba(239,68,68,0.6)]" : "bg-[#384A6E]/20 text-[#F8FAFC] border border-[#384A6E]/50 hover:bg-[#384A6E]/40 hover:border-[#E2B875]"}`}
        >
          <div className="flex items-center gap-3 relative z-10">
            <Zap className={`w-5 h-5 ${isInjecting ? "text-white" : "text-[#E2B875]"}`} />
            {isInjecting ? "INJECTING DATA STORM..." : "SIMULATE CHAT INJECTION (HOLD)"}
          </div>
        </button>
      </div>
    </div>
  );
}
