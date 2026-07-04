"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { VanillaIngestion } from './webgl/VanillaIngestion';
import { VanillaRetrieval } from './webgl/VanillaRetrieval';
import { NexynIngestion } from './webgl/NexynIngestion';
import { NexynInstinct } from './webgl/NexynInstinct';

const WindowCard = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => (
  <div className="flex flex-col bg-[#0B0F19] rounded-xl border border-white/10 overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
    <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex flex-col relative z-10">
      <span className="text-white font-semibold text-sm">{title}</span>
      <span className="text-[#94A3B8] text-xs">{subtitle}</span>
    </div>
    <div className="relative aspect-square w-full bg-[#05070a]">
      {children}
    </div>
  </div>
);

export function ComparisonGrid() {
  return (
    <div className="w-full max-w-6xl mx-auto py-24 px-6 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white mb-4">Architectural Comparison</h2>
        <p className="text-[#94A3B8] max-w-2xl mx-auto">
          See how Project Nexyn solves the traditional AI memory bloat problem in real-time.
        </p>
      </div>
      
      {/* 2x2 Grid on desktop, 1x4 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <WindowCard title="Vanilla AI: Ingestion" subtitle="Context Bloat: Endless data dumping">
          {/* We lock the aspect ratio to the square container and keep Canvas sizing responsive */}
          <Canvas camera={{ position: [0, 0, 10] }} dpr={[1, 2]} gl={{ antialias: false }}>
            <Suspense fallback={null}>
              <VanillaIngestion />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
            </Suspense>
          </Canvas>
        </WindowCard>
        
        <WindowCard title="Vanilla AI: Retrieval" subtitle="Lag & Hallucination: Searching raw tangle">
          <Canvas camera={{ position: [0, 0, 10] }} dpr={[1, 2]} gl={{ antialias: false }}>
            <Suspense fallback={null}>
              <VanillaRetrieval />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Suspense>
          </Canvas>
        </WindowCard>
        
        <WindowCard title="Nexyn: Ingestion" subtitle="Buddhi Filter: Pruning low-valence data">
          <Canvas camera={{ position: [0, 2, 8] }} dpr={[1, 2]} gl={{ antialias: false }}>
            <Suspense fallback={null}>
              <NexynIngestion />
              <OrbitControls enableZoom={false} />
            </Suspense>
          </Canvas>
        </WindowCard>
        
        <WindowCard title="Nexyn: Instinct" subtitle="Neural Synthesis: High-density cores">
          <Canvas camera={{ position: [0, 0, 7] }} dpr={[1, 2]} gl={{ antialias: false }}>
            <Suspense fallback={null}>
              <NexynInstinct />
              <OrbitControls enableZoom={false} />
            </Suspense>
          </Canvas>
        </WindowCard>
      </div>
    </div>
  );
}
