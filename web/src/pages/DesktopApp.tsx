import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileSearch,
  Globe2,
  HardDrive,
  ListFilter,
  Mail,
  Play,
  Radar,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Square,
  Terminal,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../lib/utils";

type DesktopTask = {
  id: string;
  keyword: string;
  engine: string;
  country: string;
  status: string;
  progress: number;
  resultsCount: number;
  limit: number;
  filters: string[];
  logs?: string[];
  createdAt?: string;
  error?: string;
};

type DesktopResult = {
  id: string;
  taskId: string;
  type: string;
  value: string;
  source: string;
  foundAt: string;
};

const nav = [
  { id: "run", label: "Run", icon: Play },
  { id: "tasks", label: "Queue", icon: Activity },
  { id: "results", label: "Results", icon: Database },
  { id: "settings", label: "Setup", icon: Settings2 },
];

const filterOptions = [
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Radar },
  { id: "telegram", label: "Telegram", icon: Globe2 },
  { id: "whatsapp", label: "WhatsApp", icon: Zap },
];

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("complete") || value.includes("done") || value.includes("зав")) return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
  if (value.includes("error") || value.includes("fail") || value.includes("ош")) return "text-rose-300 bg-rose-400/10 border-rose-400/20";
  if (value.includes("queued") || value.includes("pending")) return "text-zinc-300 bg-zinc-500/10 border-zinc-400/20";
  return "text-sky-200 bg-sky-400/10 border-sky-400/20";
}

function prettyStatus(status: string) {
  const value = status.toLowerCase();
  if (value.includes("complete") || value.includes("done") || value.includes("зав")) return "Completed";
  if (value.includes("error") || value.includes("fail") || value.includes("ош")) return "Failed";
  if (value.includes("queued") || value.includes("pending")) return "Queued";
  if (value.includes("init") || value.includes("start")) return "Starting";
  return "Running";
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ElementType }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 font-black">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-zinc-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function TaskRow({ task, active, onClick }: { task: DesktopTask; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border-t border-white/10 px-1 py-4 transition-colors hover:bg-white/[0.025]",
        active && "bg-white/[0.04]"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", statusTone(task.status))}>
              {prettyStatus(task.status)}
            </span>
            <span className="font-mono text-[10px] text-zinc-600">#{task.id.slice(0, 8)}</span>
          </div>
          <p className="mt-2 truncate text-sm font-bold text-zinc-100">{task.keyword}</p>
          <p className="mt-1 text-[11px] text-zinc-500">{task.engine.toUpperCase()} / {task.country.toUpperCase()} / {task.filters.join(", ")}</p>
        </div>
        <div className="w-24 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>{Math.min(100, task.progress || 0)}%</span>
            <span>{task.resultsCount || 0}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-sky-300" style={{ width: `${Math.min(100, task.progress || 0)}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
}

export function DesktopApp() {
  const [tab, setTab] = useState("run");
  const [tasks, setTasks] = useState<DesktopTask[]>([]);
  const [results, setResults] = useState<DesktopResult[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [keyword, setKeyword] = useState("site:example.com contact email");
  const [engine, setEngine] = useState("google");
  const [country, setCountry] = useState("ru");
  const [limit, setLimit] = useState(40);
  const [filters, setFilters] = useState(["email", "phone"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || tasks[0],
    [selectedTaskId, tasks]
  );

  const completedCount = tasks.filter((task) => prettyStatus(task.status) === "Completed").length;
  const runningCount = tasks.filter((task) => prettyStatus(task.status) === "Running" || prettyStatus(task.status) === "Starting").length;
  const totalResults = results.length || tasks.reduce((sum, task) => sum + (task.resultsCount || 0), 0);

  async function refresh() {
    const [tasksRes, resultsRes] = await Promise.all([
      fetch("/api/desktop/tasks"),
      fetch("/api/desktop/results"),
    ]);
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data);
      if (!selectedTaskId && data[0]) setSelectedTaskId(data[0].id);
    }
    if (resultsRes.ok) {
      setResults(await resultsRes.json());
    }
  }

  useEffect(() => {
    refresh().catch(() => undefined);
    const interval = window.setInterval(() => refresh().catch(() => undefined), 1600);
    return () => window.clearInterval(interval);
  }, []);

  async function startTask() {
    if (!keyword.trim()) {
      setMessage("Enter a query or URL first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/desktop/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, engine, country, limit, filters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start task");
      setSelectedTaskId(data.taskId);
      setTab("tasks");
      await refresh();
    } catch (error: any) {
      setMessage(error.message || "Failed to start task.");
    } finally {
      setBusy(false);
    }
  }

  function toggleFilter(id: string) {
    setFilters((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(16,185,129,0.08),transparent_26%),linear-gradient(135deg,#09090b_0%,#111113_52%,#08090a_100%)]" />
        <div className="absolute inset-0 opacity-[0.055] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative grid min-h-[100dvh] grid-cols-[84px_1fr]">
        <aside className="border-r border-white/10 bg-zinc-950/70 backdrop-blur-xl">
          <div className="flex h-full flex-col items-center justify-between py-5">
            <div className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                <Search className="h-5 w-5" />
              </div>
              <nav className="space-y-2">
                {nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      title={item.label}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all active:scale-95",
                        tab === item.id
                          ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
                          : "border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500" title="Local engine">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
        </aside>

        <main className="relative min-w-0">
          <header className="flex h-20 items-center justify-between border-b border-white/10 bg-zinc-950/40 px-8 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black tracking-tight">PARSER Desktop</h1>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                  Local Engine
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">FRESKO CT workspace for scraping, extracting and exporting contact intelligence.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refresh()}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/[0.06] active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" /> Sync
              </button>
              <a
                href="/api/desktop/results/export"
                className="flex h-10 items-center gap-2 rounded-xl bg-zinc-100 px-4 text-xs font-black text-zinc-950 transition-colors hover:bg-white active:scale-[0.98]"
              >
                <Download className="h-4 w-4" /> Export CSV
              </a>
            </div>
          </header>

          <div className="grid h-[calc(100dvh-80px)] grid-cols-[1fr_420px]">
            <section className="min-w-0 overflow-y-auto px-8 py-7">
              <AnimatePresence mode="wait">
                {tab === "run" && (
                  <motion.div key="run" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-5xl">
                    <div className="grid grid-cols-[1.2fr_0.8fr] gap-6">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <div className="mb-7 flex items-start justify-between gap-6">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-200">New extraction</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Build a task like a tool, not a website form.</h2>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 text-zinc-400">
                            <FileSearch className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Query / URL / search operator</label>
                            <textarea
                              value={keyword}
                              onChange={(event) => setKeyword(event.target.value)}
                              rows={5}
                              className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-sky-300/50"
                              placeholder="site:domain.com contact OR email"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Engine</label>
                              <select value={engine} onChange={(event) => setEngine(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm font-bold outline-none focus:border-sky-300/50">
                                <option value="google">Google</option>
                                <option value="duckduckgo">DuckDuckGo</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Geo</label>
                              <select value={country} onChange={(event) => setCountry(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm font-bold outline-none focus:border-sky-300/50">
                                <option value="ru">RU</option>
                                <option value="us">US</option>
                                <option value="de">DE</option>
                                <option value="kz">KZ</option>
                                <option value="all">ALL</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Limit</label>
                              <input value={limit} onChange={(event) => setLimit(Number(event.target.value))} min={1} max={500} type="number" className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm font-bold outline-none focus:border-sky-300/50" />
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Extract</label>
                            <div className="grid grid-cols-4 gap-3">
                              {filterOptions.map((filter) => {
                                const Icon = filter.icon;
                                const active = filters.includes(filter.id);
                                return (
                                  <button
                                    key={filter.id}
                                    onClick={() => toggleFilter(filter.id)}
                                    className={cn(
                                      "flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-black transition-all active:scale-[0.98]",
                                      active ? "border-sky-300/30 bg-sky-300/10 text-sky-100" : "border-white/10 bg-zinc-950/60 text-zinc-500 hover:text-zinc-200"
                                    )}
                                  >
                                    <Icon className="h-4 w-4" />
                                    {filter.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {message && (
                            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-200">
                              {message}
                            </div>
                          )}

                          <button
                            onClick={startTask}
                            disabled={busy}
                            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-sky-200 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition-colors hover:bg-white disabled:opacity-60 active:scale-[0.99]"
                          >
                            {busy ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-zinc-950" />}
                            Launch task
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-6">
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Engine health</p>
                          <div className="mt-6 space-y-6">
                            <Metric label="Queue" value={`${tasks.length}`} detail={`${runningCount} running right now`} icon={Activity} />
                            <Metric label="Contacts" value={`${totalResults}`} detail="Stored in this local session" icon={Database} />
                            <Metric label="Success" value={`${completedCount}`} detail="Completed extraction tasks" icon={CheckCircle2} />
                          </div>
                        </div>
                        <div className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.04] p-6">
                          <div className="flex items-start gap-4">
                            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
                            <div>
                              <p className="text-sm font-black text-amber-100">Desktop v1 is local-first.</p>
                              <p className="mt-2 text-sm leading-relaxed text-amber-100/60">Next step is license sync with the website account, proxy vault and persistent result storage.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === "tasks" && (
                  <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-200">Queue</p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight">Task control center</h2>
                      </div>
                      <button onClick={() => setTab("run")} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.06]">New task</button>
                    </div>
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
                      {tasks.length === 0 ? (
                        <div className="flex h-72 flex-col items-center justify-center text-center">
                          <Terminal className="h-10 w-10 text-zinc-600" />
                          <p className="mt-4 text-lg font-black">No tasks yet</p>
                          <p className="mt-2 max-w-sm text-sm text-zinc-500">Launch your first extraction from the Run screen and the queue will become alive.</p>
                        </div>
                      ) : (
                        tasks.map((task) => <TaskRow key={task.id} task={task} active={selectedTask?.id === task.id} onClick={() => setSelectedTaskId(task.id)} />)
                      )}
                    </div>
                  </motion.div>
                )}

                {tab === "results" && (
                  <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-200">Extracted data</p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight">Results table</h2>
                      </div>
                      <a href="/api/desktop/results/export" className="rounded-xl bg-white px-4 py-2 text-xs font-black text-zinc-950 hover:bg-sky-100">Export CSV</a>
                    </div>
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/50">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                          <tr>
                            <th className="px-5 py-4">Type</th>
                            <th className="px-5 py-4">Value</th>
                            <th className="px-5 py-4">Source</th>
                            <th className="px-5 py-4">Found</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.length === 0 ? (
                            <tr><td colSpan={4} className="px-5 py-20 text-center text-zinc-500">No results yet.</td></tr>
                          ) : results.map((result) => (
                            <tr key={result.id} className="border-b border-white/5">
                              <td className="px-5 py-4 font-black text-sky-200">{result.type}</td>
                              <td className="px-5 py-4 font-mono text-zinc-100">{result.value}</td>
                              <td className="max-w-[360px] truncate px-5 py-4 text-zinc-500">{result.source}</td>
                              <td className="px-5 py-4 text-zinc-500">{result.foundAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {tab === "settings" && (
                  <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-5xl">
                    <div className="mb-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-200">Setup</p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight">Desktop workspace</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      {[
                        ["Account sync", "Connect website license and Telegram identity.", ShieldCheck],
                        ["Proxy vault", "Store VLESS, HTTP and SOCKS profiles locally.", Globe2],
                        ["Export presets", "CSV/XLSX fields, dedupe rules and naming.", ListFilter],
                        ["Engine limits", "Threads, timeouts, retries and browser profile.", Cpu],
                      ].map(([title, body, Icon]) => (
                        <div key={String(title)} className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6">
                          <Icon className="h-6 w-6 text-sky-200" />
                          <p className="mt-5 text-lg font-black">{String(title)}</p>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{String(body)}</p>
                          <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                            <Clock3 className="h-3.5 w-3.5" /> Planned
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <aside className="border-l border-white/10 bg-zinc-950/55 p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Inspector</p>
                  <p className="mt-1 text-sm font-bold text-zinc-200">{selectedTask ? selectedTask.keyword : "No task selected"}</p>
                </div>
                <Square className="h-4 w-4 text-zinc-600" />
              </div>

              {selectedTask ? (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-widest", statusTone(selectedTask.status))}>{prettyStatus(selectedTask.status)}</span>
                      <span className="font-mono text-xs text-zinc-500">{selectedTask.progress || 0}%</span>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <motion.div className="h-full rounded-full bg-sky-200" animate={{ width: `${Math.min(100, selectedTask.progress || 0)}%` }} />
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="font-mono text-lg font-black">{selectedTask.resultsCount || 0}</p>
                        <p className="text-[10px] text-zinc-600">results</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="font-mono text-lg font-black">{selectedTask.limit}</p>
                        <p className="text-[10px] text-zinc-600">limit</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="font-mono text-lg font-black">{selectedTask.filters.length}</p>
                        <p className="text-[10px] text-zinc-600">filters</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      <Terminal className="h-4 w-4" /> Live logs
                    </div>
                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {(selectedTask.logs || ["Waiting for engine output..."]).map((log, index) => (
                        <div key={`${log}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-400">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  <a href={selectedTask ? `/api/desktop/results/export?taskId=${selectedTask.id}` : "/api/desktop/results/export"} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/[0.08]">
                    <ExternalLink className="h-4 w-4" /> Export this task
                  </a>
                </div>
              ) : (
                <div className="flex h-[520px] flex-col items-center justify-center text-center text-zinc-600">
                  <Terminal className="h-10 w-10" />
                  <p className="mt-4 text-sm font-bold">Launch a task to inspect it here.</p>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
