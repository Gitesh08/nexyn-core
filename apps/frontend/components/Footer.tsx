import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#222222] bg-[#050505] pt-12 pb-8 relative z-10 font-sans">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/nexyn-logo.svg" alt="Nexyn" className="w-8 h-8" />
              <span className="text-xl font-bold text-white tracking-tight">Nexyn</span>
            </div>
            <p className="text-[#888888] text-sm leading-relaxed max-w-sm">
              The biological memory upgrade layer for AI. Fix context bloat, add mathematical decay, and compress data into pure instinct.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-wider uppercase">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://pypi.org/project/nexyn-core/" target="_blank" rel="noopener noreferrer" className="text-[#888888] hover:text-white transition-colors text-sm">
                  PyPI Package
                </a>
              </li>
              <li>
                <Link href="/documentation" className="text-[#888888] hover:text-white transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-[#888888] hover:text-white transition-colors text-sm">
                  Live Demo Sandbox
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm tracking-wider uppercase">Connect</h4>
            <p className="text-[#888888] text-sm leading-relaxed mb-4">
              If you find Nexyn useful, consider supporting the project by giving it a star on GitHub!
            </p>
            <a href="https://github.com/Gitesh08/nexyn-core" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#111111] border border-[#333333] hover:border-[#555555] text-[#A1A1AA] hover:text-white transition-all text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Star on GitHub
            </a>
          </div>

        </div>
        
        <div className="border-t border-[#222222] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#555555] text-xs">
            © {new Date().getFullYear()} Nexyn Core Team. Open Source under MIT License.
          </p>
          <div className="flex gap-4">
            <span className="text-[#555555] text-xs">Powered by Cognee & NVIDIA NIM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
