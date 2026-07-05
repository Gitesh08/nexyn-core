import React from "react";
import { BookOpen, ArrowRight, BrainCircuit, Database, Search, X, Copy, Check } from "lucide-react";

export function DemoScriptSidebar({ onClose }: { onClose?: () => void }) {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="h-full bg-[#050505] border border-[#333333] rounded-xl p-6 overflow-y-auto custom-scrollbar shadow-xl relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-[#888888] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#222222] pr-6">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">How to Test</h2>
          <p className="text-xs text-[#888888]">Follow this simple guide</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Step 1 */}
        <div className="relative pl-4 border-l-2 border-[#a855f7]/50">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#a855f7] flex items-center justify-center text-[10px] font-bold text-black">1</div>
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <BrainCircuit className="w-3 h-3 text-[#a855f7]" />
            Ingest a Memory
          </h3>
          <p className="text-xs text-[#AAAAAA] mb-3 leading-relaxed flex flex-wrap items-center gap-1">
            Type a simple fact into the Layer 1 Ingest box (e.g., 
            <span className="text-white font-mono bg-white/10 px-1 rounded flex items-center gap-1">
              "Mumbai temp is 20 degrees"
              <button onClick={() => handleCopy("Mumbai temp is 20 degrees")} className="text-[#888888] hover:text-white transition-colors">
                {copiedText === "Mumbai temp is 20 degrees" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
            ) and click <strong>Ingest</strong>.
          </p>
          <div className="bg-black/50 border border-[#222222] rounded p-2 text-[10px] text-[#888888]">
            <strong className="text-[#E5E5E5]">What happens:</strong> The LLM scores the valence (importance) and assigns a decay rate. Check the Registry Table to see it!
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative pl-4 border-l-2 border-[#22c55e]/50">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center text-[10px] font-bold text-black">2</div>
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Database className="w-3 h-3 text-[#22c55e]" />
            Sweep & Prune
          </h3>
          <p className="text-xs text-[#AAAAAA] mb-3 leading-relaxed">
            Watch the <strong>Current W.</strong> value count down. Click <strong>Sweep & Prune</strong> repeatedly to manually fast-forward time until the weight hits zero.
          </p>
          <div className="bg-black/50 border border-[#222222] rounded p-2 text-[10px] text-[#888888] mb-2">
            <strong className="text-[#E5E5E5]">Example:</strong> Try ingesting <em>"I drank coffee"</em> (low valence), then click <strong>Sweep & Prune</strong> 2-3 times. Watch it disappear!
          </div>
          <div className="bg-black/50 border border-[#222222] rounded p-2 text-[10px] text-[#888888]">
            <strong className="text-[#E5E5E5]">What happens:</strong> Memories that hit zero weight are marked as <span className="text-[#A1A1AA] font-mono">pending_prune</span> and are forgotten forever.
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative pl-4 border-l-2 border-[#3b82f6]/50">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#3b82f6] flex items-center justify-center text-[10px] font-bold text-black">3</div>
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Search className="w-3 h-3 text-[#3b82f6]" />
            Recall (Search)
          </h3>
          <p className="text-xs text-[#AAAAAA] mb-3 leading-relaxed flex flex-wrap items-center gap-1">
            First, click <strong>1. Memify</strong> to build the vector graph. Then type a question like 
            <span className="text-white font-mono bg-white/10 px-1 rounded flex items-center gap-1">
              "weather in mumbai"
              <button onClick={() => handleCopy("weather in mumbai")} className="text-[#888888] hover:text-white transition-colors">
                {copiedText === "weather in mumbai" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
             and click <strong>2. Recall</strong>.
          </p>
          <div className="bg-black/50 border border-[#222222] rounded p-2 text-[10px] text-[#888888]">
            <strong className="text-[#E5E5E5]">What happens:</strong> The system finds the exact memory, scores the semantic match, and resets the memory's decay clock (rehearsal)!
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-[#222222] text-center">
          <p className="text-[10px] text-[#666666] italic flex items-center justify-center gap-1">
            Try it yourself! <ArrowRight className="w-3 h-3" />
          </p>
        </div>

      </div>
    </div>
  );
}
