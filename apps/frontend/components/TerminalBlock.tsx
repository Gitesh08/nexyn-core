import { Terminal } from "lucide-react";

export function TerminalBlock() {
  return (
    <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-xl bg-[#070A13] border border-[#384A6E]/30 shadow-2xl shadow-[#E2B875]/5 relative z-10 transition-transform duration-1000 hover:scale-[1.01]">
      <div className="flex items-center justify-between border-b border-[#384A6E]/30 bg-[#384A6E]/5 px-4 py-3">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
          <Terminal className="h-3.5 w-3.5" />
          <span>bash</span>
        </div>
      </div>
      <div className="p-6 text-sm font-mono text-[#94A3B8] flex items-center justify-start gap-4 overflow-x-auto">
        <span className="text-[#384A6E] select-none">~</span>
        <span className="text-[#F8FAFC]">npm install @veda/nexyn</span>
      </div>
    </div>
  );
}
