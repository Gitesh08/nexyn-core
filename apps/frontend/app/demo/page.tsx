"use client";

import React, { useEffect, useState, Fragment } from "react";
import Image from "next/image";
import { RotateCcw, Search, Database, Layers, BrainCircuit, Settings, X, Check, FastForward, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DemoScriptSidebar } from "@/components/DemoScriptSidebar";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [isConfigured, setIsConfigured] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [showScript, setShowScript] = useState(false);

  // Layer 4 state
  const [query, setQuery] = useState("");
  const [recallResults, setRecallResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Layer 1/2 state
  const [ingestText, setIngestText] = useState("");
  const [ingestResult, setIngestResult] = useState<any>(null);
  const [ingesting, setIngesting] = useState(false);

  // Memify state
  const [memifying, setMemifying] = useState(false);
  const [memifySuccess, setMemifySuccess] = useState(false);
  const [hasMemified, setHasMemified] = useState(false);

  // Smart Polling State
  const [isPolling, setIsPolling] = useState(false);

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nimKey, setNimKey] = useState("");
  const [cogneeKey, setCogneeKey] = useState("");
  const [cogneeUrl, setCogneeUrl] = useState("");
  const [tenantId, setTenantId] = useState("hackathon_demo");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    return {
      "Content-Type": "application/json",
      "x-tenant-id": localStorage.getItem("nexyn_tenant_id") || "hackathon_demo",
      "x-user-id": localStorage.getItem("nexyn_user_id") || "anonymous",
      "x-nim-key": localStorage.getItem("nexyn_nim_key") || "",
      "x-cognee-key": localStorage.getItem("nexyn_cognee_key") || "",
      "x-cognee-url": localStorage.getItem("nexyn_cognee_url") || ""
    };
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setBackendError(false);
    try {
      localStorage.setItem("nexyn_nim_key", nimKey);
      localStorage.setItem("nexyn_cognee_key", cogneeKey);
      localStorage.setItem("nexyn_cognee_url", cogneeUrl);
      localStorage.setItem("nexyn_tenant_id", tenantId);
      localStorage.setItem("nexyn_user_id", userId);

      setSaved(true);
      setIsConfigured(true);
      setTimeout(() => {
        setSaved(false);
        setSettingsOpen(false);
        fetchLogs();
      }, 1500);
    } catch (e) {
      console.error(e);
      setBackendError(true);
    } finally {
      setSaving(false);
    }
  };

  const checkConfig = async () => {
    const storedNim = localStorage.getItem("nexyn_nim_key");
    const storedCognee = localStorage.getItem("nexyn_cognee_key");
    const storedCogneeUrl = localStorage.getItem("nexyn_cognee_url");
    const storedTenant = localStorage.getItem("nexyn_tenant_id") || "hackathon_demo";
    let storedUser = localStorage.getItem("nexyn_user_id");

    if (!storedUser) {
      storedUser = Math.random().toString(36).substring(2, 10);
      localStorage.setItem("nexyn_user_id", storedUser);
    }

    setNimKey(storedNim || "");
    setCogneeKey(storedCognee || "");
    setCogneeUrl(storedCogneeUrl || "");
    setTenantId(storedTenant);
    setUserId(storedUser);

    if (!storedNim || !storedCognee) {
      setIsConfigured(false);
      setSettingsOpen(true);
    } else {
      setIsConfigured(true);
    }
  };

  const fetchLogs = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/memories`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
      setNow(Date.now());

      // Removed smart polling auto-stop to guarantee perfect sync during the demo
    } catch (e: any) {
      if (e.message !== "Failed to fetch logs" && !e?.message?.includes("Failed to fetch")) {
        console.error("fetchLogs error:", e);
      }
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  };
  const handleClearData = async () => {
    try {
      await fetch(`${API_BASE}/api/memories`, { method: "DELETE", headers: getHeaders() });
      await fetchLogs();
    } catch (e) {
      console.error("Failed to clear data", e);
    }
  };

  const handleMemify = async () => {
    setMemifying(true);
    try {
      await fetch(`${API_BASE}/api/memify`, { method: "POST", headers: getHeaders() });
      setMemifySuccess(true);
      setHasMemified(true);
      setTimeout(() => setMemifySuccess(false), 3000);
    } catch (e) {
      console.error("Failed to memify", e);
    } finally {
      setMemifying(false);
    }
  };

  const [sweeping, setSweeping] = useState(false);
  const handleSweep = async () => {
    setSweeping(true);
    try {
      await fetch(`${API_BASE}/api/sweep`, { method: "POST", headers: getHeaders() });
      await fetchLogs();
    } catch (e) {
      console.error("Failed to sweep", e);
    } finally {
      setSweeping(false);
    }
  };

  const handleRecall = async (e: any) => {
    e.preventDefault();
    if (!query) return;

    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/recall`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ query, top_k: 3 })
      });
      const data = await res.json();
      setRecallResults(data);

      fetchLogs();
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async (e: any) => {
    e.preventDefault();
    if (!ingestText) return;

    setIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/nexyn/ingest`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ text: ingestText })
      });
      const data = await res.json();
      setIngestResult(data);
      setIngestText("");
      // Continuous polling handles sync automatically
    } catch (e) {
      console.error(e);
      setIngestResult({ error: String(e) });
    } finally {
      setIngesting(false);
    }
  };

  useEffect(() => {
    document.title = "Nexyn | Internals Dashboard";
    checkConfig().then(() => {
      fetchLogs();
    });
  }, []);

  // SSE Real-time Streaming
  useEffect(() => {
    if (!isConfigured) return;

    // Construct headers for SSE (EventSource doesn't support custom headers easily, so we use query params)
    const tenantId = localStorage.getItem("nexyn_tenant_id") || "hackathon_demo";
    const userId = localStorage.getItem("nexyn_user_id") || "anonymous";

    // Since native EventSource doesn't support headers, we must send the keys in a way the backend can read them.
    // Wait, the backend expects `x-tenant-id` and `x-user-id` as HEADERS!
    // We'll need a custom fetch-based SSE or we'll update the backend to accept query parameters!
    // Since we're using a fetch-based approach for SSE, let's just use it:
    const abortController = new AbortController();

    const connectSSE = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/memories/stream`, {
          headers: getHeaders(),
          signal: abortController.signal
        });

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6);
              try {
                const data = JSON.parse(dataStr);
                setLogs(data);
                setNow(Date.now());
                setLoading(false);
              } catch (e) {
                console.error("SSE JSON Parse error:", e);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          if (!err?.message?.includes("Failed to fetch")) {
            console.error("SSE fetch error:", err);
          }
          setBackendError(true);
        }
      }
    };

    connectSSE();
    return () => abortController.abort();
  }, [isConfigured]);

  // Local UI Ticker (Updates age and weight smoothly every second without hammering the server)
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto pt-8 lg:pt-16 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Main App */}
        <div className="flex-1 min-w-0">
          {/* HEADER */}
        <div className="flex justify-between items-end mb-12 border-b border-[#333333] pb-6">
          <div className="flex items-center gap-4">
            <Image src="/nexyn-logo.svg" alt="Nexyn" width={48} height={48} />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 flex flex-wrap items-center gap-4">
                Nexyn Internals
                <button
                  onClick={() => setShowScript(!showScript)}
                  className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] border border-[#a855f7] text-[#a855f7] transition-colors rounded-md text-sm font-medium flex items-center gap-2"
                  title="Toggle testing guide"
                >
                  <BookOpen className="w-4 h-4" />
                  How to test?
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-1.5 bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] rounded-md transition-colors text-[#A1A1AA] hover:text-white"
                  title="Configure API Keys"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </h1>
              <p className="text-[#888888] text-sm">Real-time view of the 4-layer biomimetic pipeline.</p>
            </div>
          </div>
        </div>

        {/* LAYER DEFINITIONS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            { id: 1, name: "Sensory Buffer", desc: "Ingests raw text and normalizes it." },
            { id: 2, name: "Evaluator", desc: "LLM scores Valence & assigns weights." },
            { id: 3, name: "Consolidation", desc: "Background sweep decays and prunes." },
            { id: 4, name: "Retrieval", desc: "Searches & triggers Rehearsal resets." }
          ].map(layer => (
            <div key={layer.id} className="bg-[#0A0A0A] border border-[#333333] p-4 rounded-md hover:bg-[#111111] transition-colors">
              <div className="text-xs text-[#888888] font-mono mb-2">LAYER 0{layer.id}</div>
              <h2 className="text-sm font-medium text-white mb-1">{layer.name}</h2>
              <p className="text-xs text-[#555555]">{layer.desc}</p>
            </div>
          ))}
        </div>

        {/* LAYER 1/2 TESTER */}
        <div className="bg-[#0A0A0A] border border-[#333333] rounded-md p-6 mb-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-[#888888]" />
            <h2 className="text-sm font-medium text-white">Test Layers 1 & 2 (Ingest & Evaluate)</h2>
          </div>

          <form onSubmit={handleIngest} className="flex gap-3 relative z-10">
            <input
              type="text"
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              placeholder="Inject raw text into sensory buffer..."
              className="flex-1 bg-black border border-[#333333] rounded-md px-4 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888] transition-colors"
            />
            <button
              type="submit"
              disabled={ingesting || !ingestText.trim() || !isConfigured}
              className="px-6 py-2 bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-50 transition-colors rounded-md text-sm font-medium"
            >
              {ingesting ? 'Ingesting...' : 'Ingest'}
            </button>
          </form>

          {ingestResult && (
            <div className="mt-4 bg-black border border-[#333333] rounded-md p-4 relative z-10">
              <div className="text-xs text-[#888888] mb-2 uppercase tracking-widest font-medium">Result</div>
              <div className="text-sm text-white font-mono overflow-x-auto whitespace-pre-wrap break-all custom-scrollbar pb-2">{JSON.stringify(ingestResult, null, 2)}</div>
            </div>
          )}
        </div>


        {/* GLOBAL REGISTRY TABLE */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#888888]" />
            <h2 className="text-sm font-medium text-white">Registry State (Layers 1-3)</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleSweep}
                disabled={sweeping || !isConfigured}
                title="Manually fast-forward time and prune dead memories."
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] border border-[#22c55e] text-[#22c55e] transition-colors rounded text-xs font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <FastForward className="w-3 h-3" />
                {sweeping ? 'Consolidating...' : 'Sweep & Prune'}
              </button>
              <button
                onClick={handleClearData}
                disabled={!isConfigured}
                title="Wipe your personal memory graph clean."
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] border border-[#ff4444] text-[#ff4444] transition-colors rounded text-xs font-medium flex items-center gap-2 disabled:opacity-50"
              >
                Clear Registry
              </button>
              <button
                onClick={fetchLogs}
                disabled={!isConfigured}
                title="Refresh the table below."
                className="px-3 py-1.5 bg-white hover:bg-[#E5E5E5] text-black transition-colors rounded text-xs font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                Sync State
              </button>
            </div>
            <div className="text-[10px] text-[#888888]">
              <strong>Tip:</strong> Hover over the buttons to see what they do!
            </div>
          </div>
        </div>

        <AnimatePresence>
          {memifySuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-[#0A0A0A] border border-[#a855f7] rounded-md shadow-lg shadow-purple-500/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#a855f7]/20 flex items-center justify-center text-[#a855f7]">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Graph Enrichment Complete!</h3>
                  <p className="text-xs text-[#888888]">Your memory traces have been successfully woven into the Cognee semantic graph.</p>
                </div>
              </div>
              <button onClick={() => setMemifySuccess(false)} className="text-[#555555] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-[#0A0A0A] rounded-md border border-[#333333]"></div>
            <div className="h-20 bg-[#0A0A0A] rounded-md border border-[#333333]"></div>
          </div>
        ) : (
          <div className="bg-[#0A0A0A] border border-[#333333] rounded-md overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111111] border-b border-[#333333] text-[10px] uppercase tracking-widest text-[#888888]">
                  <th className="p-3 font-medium border-r border-[#333333]">ID / Text (L1)</th>
                  <th className="p-3 font-medium border-r border-[#333333] text-center">Valence (L2)</th>
                  <th className="p-3 font-medium border-r border-[#333333] text-center">Current W. (L3)</th>
                  <th className="p-3 font-medium border-r border-[#333333] text-center">Decay (L2)</th>
                  <th className="p-3 font-medium border-r border-[#333333] text-right">Age (L3)</th>
                  <th className="p-3 font-medium text-center">Status (L3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {logs.map((log: any) => {
                  const created = new Date(log.created_at);
                  const aliveDays = Math.max(0, (now - created.getTime()) / (1000 * 60 * 60 * 24));

                  let wCurrent = null;
                  if (log.weight_initial !== null && log.decay_rate !== null) {
                    wCurrent = Math.max(0, log.weight_initial - (log.decay_rate * aliveDays));
                  }

                  let ageDisplay = "";
                  if (aliveDays < 1 / 24) {
                    const minutes = Math.floor(aliveDays * 24 * 60);
                    const seconds = Math.floor((aliveDays * 24 * 60 * 60) % 60);
                    ageDisplay = `${minutes}m ${seconds}s`;
                  } else if (aliveDays < 1) {
                    ageDisplay = `${(aliveDays * 24).toFixed(2)}h`;
                  } else {
                    ageDisplay = `${aliveDays.toFixed(2)}d`;
                  }

                  return (
                    <React.Fragment key={log.node_id}>
                      <tr className="border-b border-[#222222] hover:bg-[#111111] transition-colors">
                        <td className="p-3 border-r border-[#333333] max-w-xs">
                          <div className="text-[10px] text-[#555555] font-mono mb-1 leading-none">{log.node_id.substring(0, 8)}</div>
                          <div className="text-sm text-[#E5E5E5] truncate" title={log.text}>{log.text}</div>
                        </td>
                        <td className="p-3 border-r border-[#333333] text-center align-middle">
                          <span className="text-sm text-white font-mono">{log.valence_score}</span>
                        </td>
                        <td className="p-3 border-r border-[#333333] text-center align-middle">
                          <div className="text-sm text-[#4CAF50] font-mono font-medium">
                            {wCurrent === null ? '∞' : wCurrent.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-[#555555] font-mono mt-0.5">
                            Start: {log.weight_initial === null ? '∞' : log.weight_initial}
                          </div>
                        </td>
                        <td className="p-3 border-r border-[#333333] text-center align-middle">
                          <span className="text-sm text-[#A1A1AA] font-mono">
                            {log.decay_rate} / d
                          </span>
                        </td>

                        <td className="p-3 border-r border-[#333333] text-right align-middle">
                          <span className="text-sm text-[#A1A1AA] font-mono">
                            {ageDisplay}
                          </span>
                        </td>
                        <td className="p-3 text-center align-middle">
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border ${log.status === 'active' ? 'bg-[#0A0A0A] border-[#333333] text-white' :
                                log.status === 'evaluating (layer 2)' ? 'bg-[#1a1a1a] border-[#ffb000] text-[#ffb000] animate-pulse' :
                                  log.status === 'pending_prune' ? 'bg-[#1a1a1a] border-[#555555] text-[#A1A1AA]' :
                                    'bg-transparent border-[#333333] text-[#555555]'
                              }`}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {log.reason && log.status !== 'evaluating (layer 2)' && (
                        <tr className="border-b border-[#222222] bg-[#050505]">
                          <td colSpan={6} className="p-3 pl-6 text-xs text-[#888888] font-mono italic">
                            <span className="text-[#A1A1AA] font-semibold not-italic">L2 Rationale: </span>
                            {log.reason}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#555555] text-sm">
                      No memory traces found in registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* LAYER 4 TESTER */}
        <div className="bg-[#0A0A0A] border border-[#333333] rounded-md p-6 mt-12 mb-12 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-[#888888]" />
            <h2 className="text-sm font-medium text-white">Test Layer 4 (Recall & Reinforce)</h2>
          </div>

          <form onSubmit={handleRecall} className="flex gap-3 mb-6 relative z-10">
            <button
              type="button"
              onClick={handleMemify}
              disabled={memifying || !isConfigured}
              title="Convert unstructured text traces into semantic knowledge graph nodes."
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] border border-[#a855f7] text-[#a855f7] transition-colors rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <BrainCircuit className="w-4 h-4" />
              {memifying ? 'Memifying...' : '1. Memify'}
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query the memory graph..."
              className="flex-1 bg-black border border-[#333333] rounded-md px-4 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888] transition-colors"
            />
            <button
              type="submit"
              disabled={searching || !query.trim() || !isConfigured || !hasMemified}
              title={!hasMemified ? "Click Memify first to build the vector index!" : ""}
              className="px-6 py-2 bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-50 transition-colors rounded-md text-sm font-medium shrink-0"
            >
              {searching ? 'Searching...' : '2. Recall'}
            </button>
          </form>

          {recallResults && (
            <div className="bg-black border border-[#333333] rounded-md p-4 relative z-10">
              <div className="text-xs text-[#888888] mb-4 uppercase tracking-widest font-medium">Top Results</div>

              {recallResults.error && (
                <div className="text-red-400 text-sm font-mono">Error: {recallResults.error}</div>
              )}

              {!recallResults.error && recallResults.matches?.length === 0 && (
                <div className="text-[#555555] text-sm italic">No relevant memories found in graph.</div>
              )}

              {!recallResults.error && recallResults.matches?.length > 0 && (
                <div className="space-y-2">
                  {recallResults.matches.map((m: any, i: number) => (
                    <div key={m.node_id} className="bg-[#0A0A0A] border border-[#333333] rounded p-3 flex justify-between items-center group hover:border-[#555555] transition-colors">
                      <div>
                        <div className="text-sm text-white mb-1">{m.text}</div>
                        <div className="text-[10px] text-[#555555] font-mono">{m.node_id}</div>
                      </div>
                      <div className="text-right flex gap-6">
                        <div>
                          <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-1">Semantic Match</div>
                          <div className="text-xs text-white font-mono">{(m.semantic_similarity * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#888888] uppercase tracking-wider mb-1">Composite Score</div>
                          <div className="text-xs text-white font-mono">{(m.composite_score * 100).toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        {/* RIGHT COLUMN: Demo Script */}
        <AnimatePresence>
          {showScript && (
            <motion.div 
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 350, marginLeft: 32 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              className="hidden lg:block shrink-0 border-l border-[#333333] pt-8 lg:pt-0 overflow-hidden sticky top-24 h-[calc(100vh-8rem)]"
            >
              <div className="w-[350px] h-full">
                <DemoScriptSidebar onClose={() => setShowScript(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile script fallback */}
        {showScript && (
          <div className="block lg:hidden w-full border-t border-[#333333] pt-8 mt-8">
            <DemoScriptSidebar onClose={() => setShowScript(false)} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-[#333333] rounded-lg w-full max-w-md p-6 relative shadow-2xl"
            >
              <button onClick={() => setSettingsOpen(false)} className="absolute top-4 right-4 text-[#888888] hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold text-white mb-2">Hackathon Configuration</h2>
              <p className="text-sm text-[#888888] mb-6">Enter your API keys and User ID to isolate your graph.</p>

              {backendError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                  Backend connection failed. Is it running?
                </div>
              )}

              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="pb-4 border-b border-[#333333]">
                  <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] font-medium mb-1">
                    NVIDIA NIM API Key
                  </label>
                  <a href="https://build.nvidia.com/meta/llama-3_1-8b-instruct" target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 hover:underline mb-2">
                    Get your free NVIDIA NIM API key here &rarr;
                  </a>
                  <input
                    type="password"
                    value={nimKey}
                    onChange={(e) => setNimKey(e.target.value)}
                    placeholder="nvapi-..."
                    className="w-full bg-black border border-[#333333] rounded-md px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888]"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] font-medium">Cognee Configuration</label>
                    <a href="https://platform.cognee.ai/api-keys" target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 hover:underline">
                      Manage Cognee Cloud Tenants & Keys &rarr;
                    </a>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#777777] font-medium mb-1">Tenant ID</label>
                      <input
                        type="text"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        placeholder="hackathon_demo"
                        className="w-full bg-black border border-[#333333] rounded-md px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#777777] font-medium mb-1">User ID (Isolates your graph)</label>
                      <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="user_123"
                        className="w-full bg-black border border-[#333333] rounded-md px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#777777] font-medium mb-1">Cognee API Key</label>
                      <input
                        type="password"
                        value={cogneeKey}
                        onChange={(e) => setCogneeKey(e.target.value)}
                        placeholder="Enter Cognee Cloud API Key"
                        className="w-full bg-black border border-[#333333] rounded-md px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#777777] font-medium mb-1">Cognee API URL</label>
                      <input
                        type="url"
                        value={cogneeUrl}
                        onChange={(e) => setCogneeUrl(e.target.value)}
                        placeholder="e.g. https://tenant-12345.aws.cognee.ai"
                        className="w-full bg-black border border-[#333333] rounded-md px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving || saved}
                  className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : (saving ? "Saving..." : "Save Keys")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
