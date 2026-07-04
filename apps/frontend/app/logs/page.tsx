"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RotateCcw, Search, Database, Layers, ShieldAlert, Terminal } from "lucide-react";

export default function LogsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [logs, setLogs] = useState([]);
  const [postgresLogs, setPostgresLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("registry"); // "registry" | "postgres_logs"

  // Layer 4 state
  const [query, setQuery] = useState("");
  const [recallResults, setRecallResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Layer 1/2 state
  const [ingestText, setIngestText] = useState("");
  const [ingestResult, setIngestResult] = useState<any>(null);
  const [ingesting, setIngesting] = useState(false);

  // Smart Polling State
  const [isPolling, setIsPolling] = useState(false);

  const getHeaders = () => {
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

  const fetchLogs = async () => {
    try {
      const headers = getHeaders();
      
      // Fetch memories
      const memoriesRes = await fetch(`${API_BASE}/api/memories`, { headers });
      const memoriesData = await memoriesRes.json();
      setLogs(memoriesData);

      // Fetch PostgreSQL logs
      const logsRes = await fetch(`${API_BASE}/api/logs`, { headers });
      const logsData = await logsRes.json();
      setPostgresLogs(logsData);

      setNow(Date.now());

      // Auto-stop polling if nothing is evaluating
      if (isPolling && !memoriesData.some((log: any) => log.status === 'evaluating (layer 2)')) {
        setIsPolling(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    try {
      const headers = getHeaders();
      await fetch(`${API_BASE}/api/memories`, { 
        method: "DELETE",
        headers
      });
      await fetchLogs();
    } catch (e) {
      console.error("Failed to clear data", e);
    }
  };

  const handleRecall = async (e: any) => {
    e.preventDefault();
    if (!query) return;

    setSearching(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`${API_BASE}/api/recall`, {
        method: "POST",
        headers,
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
      const headers = getHeaders();
      const res = await fetch(`${API_BASE}/nexyn/ingest`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: ingestText })
      });
      const data = await res.json();
      setIngestResult(data);
      setIngestText("");

      // Smart Polling
      setIsPolling(true);

    } catch (e) {
      console.error(e);
      setIngestResult({ error: String(e) });
    } finally {
      setIngesting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Smart Polling Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(() => {
        fetchLogs();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPolling]);

  // Local UI Ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto pt-16">

        {/* HEADER */}
        <div className="flex justify-between items-end mb-12 border-b border-[#333333] pb-6">
          <div className="flex items-center gap-4">
            <Image src="/nexyn-logo.svg" alt="Nexyn" width={48} height={48} />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
                Nexyn Internals
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
        <div className="bg-[#0A0A0A] border border-[#333333] rounded-md p-6 mb-10 relative overflow-hidden">
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
              disabled={ingesting || !ingestText.trim()}
              className="px-6 py-2 bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-50 transition-colors rounded-md text-sm font-medium"
            >
              {ingesting ? 'Ingesting...' : 'Ingest'}
            </button>
          </form>

          {ingestResult && (
            <div className="mt-4 bg-black border border-[#333333] rounded-md p-4 relative z-10">
              <div className="text-xs text-[#888888] mb-2 uppercase tracking-widest font-medium">Result</div>
              <div className="text-sm text-white font-mono">{JSON.stringify(ingestResult)}</div>
            </div>
          )}
        </div>

        {/* TAB CONTROLS */}
        <div className="flex justify-between items-center mb-6 border-b border-[#222222]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("registry")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "registry"
                  ? "border-white text-white font-semibold"
                  : "border-transparent text-[#888888] hover:text-white"
              }`}
            >
              <Database className="w-4 h-4" />
              Memory Registry (SQLite)
            </button>
            <button
              onClick={() => setActiveTab("postgres_logs")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "postgres_logs"
                  ? "border-white text-white font-semibold"
                  : "border-transparent text-[#888888] hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4" />
              System Diagnostics (Remote Postgres)
            </button>
          </div>
          <div className="flex gap-2 pb-3">
            {activeTab === "registry" && (
              <button
                onClick={handleClearData}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] border border-[#ff4444]/40 hover:border-[#ff4444] text-[#ff4444] transition-colors rounded text-xs font-medium flex items-center gap-2"
              >
                Clear Registry
              </button>
            )}
            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 bg-white hover:bg-[#E5E5E5] text-black transition-colors rounded text-xs font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Sync State
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-[#0A0A0A] rounded-md border border-[#333333]"></div>
            <div className="h-20 bg-[#0A0A0A] rounded-md border border-[#333333]"></div>
          </div>
        ) : activeTab === "registry" ? (
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
                    <tr key={log.node_id} className="hover:bg-[#111111] transition-colors">
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
        ) : (
          <div className="bg-[#0A0A0A] border border-[#333333] rounded-md overflow-hidden font-mono text-xs">
            <div className="max-h-[500px] overflow-y-auto divide-y divide-[#222222]">
              {postgresLogs.map((log: any) => {
                let badgeColor = "border-[#555555] text-[#888888]";
                if (log.category === "SYSTEM_START" || log.category === "SYSTEM_SHUTDOWN") {
                  badgeColor = "border-emerald-500 text-emerald-400 bg-emerald-950/20";
                } else if (log.category === "API_KEY_VALIDATION") {
                  badgeColor = log.level === "ERROR" 
                    ? "border-rose-500 text-rose-400 bg-rose-950/20" 
                    : log.level === "WARNING"
                      ? "border-amber-500 text-amber-400 bg-amber-950/20"
                      : "border-sky-500 text-sky-400 bg-sky-950/20";
                } else if (log.category.startsWith("LAYER_1")) {
                  badgeColor = "border-violet-500 text-violet-400 bg-violet-950/20";
                } else if (log.category.startsWith("LAYER_2")) {
                  badgeColor = "border-cyan-500 text-cyan-400 bg-cyan-950/20";
                } else if (log.category.startsWith("LAYER_3")) {
                  badgeColor = "border-orange-500 text-orange-400 bg-orange-950/20";
                } else if (log.category.startsWith("LAYER_4")) {
                  badgeColor = "border-teal-500 text-teal-400 bg-teal-950/20";
                }

                return (
                  <div key={log.id} className="p-3 hover:bg-[#111111] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-[#555555]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wider font-semibold ${badgeColor}`}>
                          {log.category}
                        </span>
                        <span className={`text-[9px] px-1 font-semibold ${
                          log.level === 'ERROR' ? 'text-rose-500' : log.level === 'WARNING' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          [{log.level}]
                        </span>
                      </div>
                      <div className="text-white text-sm break-words leading-relaxed">{log.message}</div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2 text-[10px] text-[#888888] cursor-pointer">
                          <summary className="hover:text-white transition-colors">View details metadata</summary>
                          <pre className="mt-1 bg-black p-2 rounded border border-[#222222] overflow-x-auto text-[10px] text-zinc-400">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-right text-[10px] text-[#555555] font-mono shrink-0">
                      <div>Tenant: {log.tenant_id || "N/A"}</div>
                      <div>User: {log.user_id || "N/A"}</div>
                    </div>
                  </div>
                );
              })}
              {postgresLogs.length === 0 && (
                <div className="p-8 text-center text-[#555555] text-sm">
                  No remote system logs found. Make sure your remote database credentials are correct.
                </div>
              )}
            </div>
          </div>
        )}

        {/* LAYER 4 TESTER */}
        <div className="bg-[#0A0A0A] border border-[#333333] rounded-md p-6 mt-12 mb-12 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-[#888888]" />
            <h2 className="text-sm font-medium text-white">Test Layer 4 (Recall & Reinforce)</h2>
          </div>

          <form onSubmit={handleRecall} className="flex gap-3 mb-6 relative z-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query the memory graph..."
              className="flex-1 bg-black border border-[#333333] rounded-md px-4 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#888888] transition-colors"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-6 py-2 bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-50 transition-colors rounded-md text-sm font-medium"
            >
              {searching ? 'Searching...' : 'Recall'}
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
                    <div key={m.node_id} className="bg-[#0A0A0A] border border-[#333333] rounded p-3 flex justify-between items-center group hover:border-[#555555] transition-colors text-left">
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
    </div>
  );
}
