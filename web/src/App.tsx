import React, { useState, useEffect } from "react";
import { 
  Search, Settings, User, LogOut, MessageCircle, Menu, X, Download, ShieldCheck, Zap,
  TrendingUp, CreditCard, ShoppingCart, History, LifeBuoy, Plus, Ticket, Users, BarChart3
} from "lucide-react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "motion/react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { cn } from "./lib/utils";
import { TopLevelView, Tab } from "./types";
import { LandingPage } from "./pages/LandingPage";
import { AuthScreen } from "./pages/AuthScreen";
import { DesktopApp } from "./pages/DesktopApp";
import { PricingPlans } from "./components/PricingPlans";
import { StatCard } from "./components/StatCard";
import { NavItem } from "./components/NavItem";

declare global {
  interface Window {
    freskoDesktop?: {
      isDesktop: boolean;
      platform: string;
      version: string;
    };
  }
}

export default function App() {
  const desktopMode = window.freskoDesktop?.isDesktop || new URLSearchParams(window.location.search).get("desktop") === "1";
  const [currentView, setCurrentView] = useState<TopLevelView>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const bgStyle = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(79,70,229,0.04),
      transparent 80%
    )
  `;

  const hasActivePlan = user?.plan && user.plan !== "FREE" && user.plan !== "NONE";

  const isElectron = window.navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskKeyword, setNewTaskKeyword] = useState("");
  const [newTaskLimit, setNewTaskLimit] = useState(10);
  const [newTaskEngine, setNewTaskEngine] = useState("google");
  const [newTaskCategory, setNewTaskCategory] = useState("SEO Parsing");
  const [newTaskService, setNewTaskService] = useState("Deep SEO Scan");

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoggedIn(true);
        if (currentView === "landing" || currentView === "auth") {
          setCurrentView("app");
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user?.plan === "ADMIN" && activeTab === "admin") {
      fetchAdminUsers();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
      const interval = setInterval(fetchTasks, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleRunParser = async () => {
    if (!hasActivePlan) {
      setActiveTab("billing");
      return;
    }
    if (!newTaskKeyword) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newTaskCategory,
          service: newTaskService,
          link: newTaskKeyword,
          limit: newTaskLimit,
          engine: newTaskEngine
        })
      });

      if (res.ok) {
        setNewTaskKeyword("");
        fetchTasks();
      } else {
        const err = await res.json();
        alert(err.error || "Ошибка запуска");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [targetUserId, setTargetUserId] = useState("");
  const [selectedGrantPlan, setSelectedGrantPlan] = useState("1m");

  const handleGrantPlan = async () => {
    try {
      const res = await fetch("/api/admin/grant-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: targetUserId, planId: selectedGrantPlan })
      });
      if (res.ok) {
        alert("План успешно выдан");
        setTargetUserId("");
        fetchAdminUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Ошибка выдачи");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setUser(null);
  };

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  if (desktopMode) {
    return <DesktopApp />;
  }

  if (currentView === "landing") {
    return <LandingPage onNavigate={setCurrentView} />;
  }

  if (!isLoggedIn || currentView === "auth") {
    return <AuthScreen onLoginSuccess={(u) => { setUser(u); setIsLoggedIn(true); setCurrentView("app"); }} />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div onMouseMove={handleMouseMove} className="flex h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden relative">
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: bgStyle,
        }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTU5LjUgMGguNXY2MGgtLjVWMHptLTIwIDBoLjV2NjBoLS41VjB6bS0yMCAwaC41djYwaC0uNVYwem0tMTkgMGguNXY2MGgtLjVWMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNMCA1OS41aDYwdi41SDB2LS41em0wLTIwaDYwdi41SDB2LS41em0wLTIwaDYwdi41SDB2LS41em0wLTE5aDYwdi41SDB2LS41eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-[0.03] pointer-events-none" />

      {/* Mobile top header */}
      <div className="md:hidden flex h-[72px] items-center justify-between p-4 border-b border-white/5 bg-black/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
         <div className="flex items-center gap-3">
           <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
             <Search className="w-5 h-5 text-white" />
           </div>
           <div>
             <h1 className="font-black text-xl tracking-tighter text-white">PARSER</h1>
             <div className="flex items-center gap-2 -mt-1">
               <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">by FRESKO CT</p>
               {isElectron && <span className="bg-emerald-500/20 text-emerald-400 text-[7px] font-black px-1 rounded border border-emerald-500/20">DESKTOP</span>}
             </div>
           </div>
         </div>
         <button onClick={toggleSidebar} className="p-2 text-white bg-neutral-800/50 rounded-xl hover:bg-neutral-800 transition-colors">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
         </button>
      </div>

      <div className="relative z-10 flex w-full h-full pt-[72px] md:pt-0">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 bg-black/80 backdrop-blur-3xl border-r border-white/5 flex flex-col fixed top-[72px] md:top-0 md:relative h-[calc(100vh-72px)] md:h-screen z-40 transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="hidden md:block p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tighter text-white">PARSER</h1>
                <div className="flex items-center gap-2 -mt-1">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">by FRESKO CT</p>
                  {isElectron && <span className="bg-emerald-500/20 text-emerald-400 text-[7px] font-black px-1 rounded border border-emerald-500/20">DESKTOP</span>}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem 
              active={activeTab === "dashboard"} 
              onClick={() => { setActiveTab("dashboard"); closeSidebar(); }} 
              icon={<User className="w-4 h-4" />} 
              label="Мой профиль" 
            />
            <NavItem 
              active={activeTab === "orders"} 
              onClick={() => { setActiveTab("orders"); closeSidebar(); }} 
              icon={<ShoppingCart className="w-4 h-4" />} 
              label="Мои задачи" 
            />
            <NavItem 
              active={activeTab === "billing"} 
              onClick={() => { setActiveTab("billing"); closeSidebar(); }} 
              icon={<CreditCard className="w-4 h-4" />} 
              label="Кошелек" 
            />
            <NavItem 
              active={activeTab === "tickets"} 
              onClick={() => { setActiveTab("tickets"); closeSidebar(); }} 
              icon={<LifeBuoy className="w-4 h-4" />} 
              label="Поддержка" 
            />
            <NavItem 
              active={activeTab === "download"} 
              onClick={() => { setActiveTab("download"); closeSidebar(); }} 
              icon={<Download className="w-4 h-4" />} 
              label="Скачать ПО"
            />
            {user?.plan === "ADMIN" && (
              <NavItem 
                active={activeTab === "admin"} 
                onClick={() => { setActiveTab("admin"); closeSidebar(); }} 
                icon={<Settings className="w-4 h-4" />} 
                label="Админ-панель"
              />
            )}
          </nav>

          <div className="p-4 border-t border-neutral-800 space-y-3 pb-8 md:pb-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                   {user?.username?.[0]?.toUpperCase() || "U"}
                 </div>
                 <div className="truncate">
                   <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                   <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold">{!hasActivePlan ? <span className="text-red-400">НЕТ ПОДПИСКИ</span> : user?.plan + " PLAN"}</p>
                 </div>
               </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl p-3 flex items-center justify-center gap-2 transition-colors font-bold text-xs"
            >
              <LogOut className="w-4 h-4" /> Выйти
            </button>
            <a 
              href="https://t.me/Fresko_CT" 
              target="_blank" 
              className="hidden md:block bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl p-3 transition-colors group"
            >
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Developer</p>
              <p className="text-xs font-bold text-indigo-200 group-hover:text-white transition-colors">@Fresko_CT</p>
            </a>
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {isSidebarOpen && (
           <div onClick={closeSidebar} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" />
        )}

        <main className="flex-1 overflow-y-auto bg-neutral-950">
          <header className="hidden md:flex h-16 border-b border-neutral-800 px-8 items-center justify-between bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              PARSER • {activeTab === "dashboard" && "Мой профиль"}
              {activeTab === "billing" && "Управление подпиской"}
              {activeTab === "download" && "Скачать приложение"}
              {activeTab === "admin" && "Админ-панель"}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">V1.0.4 - RELEASE</span>
            </div>
          </header>

          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-w-3xl mx-auto space-y-6"
                >
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-600/10 blur-[50px] pointer-events-none" />
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-900 shadow-xl shrink-0">
                          <User className="w-8 h-8 text-neutral-400" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h2 className="text-2xl font-black text-white">{user?.username}</h2>
                          <p className="text-neutral-500 text-xs truncate max-w-[200px] mx-auto sm:mx-0">{user?.email || "Email не указан"}</p>
                          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-300">
                              {user?.plan === 'FREE' || user?.plan === 'NONE' || !user?.plan ? "НЕТ ПОДПИСКИ" : user?.plan + " ACCESS"}
                            </span>
                          </div>
                          {!user?.telegram_id && (
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/auth/telegram/link", { method: "POST" });
                                  const { code, botUsername } = await res.json();
                                  window.open(`https://t.me/${botUsername}?start=link_${code}`, "_blank");
                                } catch (e) {
                                  alert("Ошибка привязки");
                                }
                              }}
                              className="block mt-2 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-[0.2em]"
                            >
                              + Привязать Telegram
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center lg:items-end gap-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">Статус аккаунта</p>
                        <p className={cn(
                          "text-2xl font-black tracking-tighter uppercase",
                          hasActivePlan ? "text-emerald-400" : "text-neutral-500"
                        )}>
                          {hasActivePlan ? "Активен" : "Не оплачен"}
                        </p>
                        <button onClick={() => setActiveTab("billing")} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                          {hasActivePlan ? "Продлить →" : "Активировать →"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-[300px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Активность задач</h3>
                        <span className="text-[10px] text-neutral-500">Количество парсов</span>
                      </div>
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            { name: 'Пн', val: 400 }, { name: 'Вт', val: 300 },
                            { name: 'Ср', val: 600 }, { name: 'Чт', val: 800 },
                            { name: 'Пт', val: 500 }, { name: 'Сб', val: 900 },
                            { name: 'Вс', val: 1200 },
                          ]}>
                            <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="val" stroke="#6366f1" fillOpacity={1} fill="url(#colorVal)" />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-[300px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-500" /> Типы парсинга</h3>
                        <span className="text-[10px] text-neutral-500">За все время</span>
                      </div>
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'SEO', val: 50 }, { name: 'Maps', val: 20 },
                            { name: 'TG Leads', val: 15 }, { name: 'VLESS', val: 15 }
                          ]}>
                            <Bar dataKey="val" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <RechartsTooltip 
                              cursor={{fill: 'transparent'}}
                              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <h3 className="text-xl font-black text-white mb-6">Безопасность</h3>
                    <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-2xl mb-4">
                      <div>
                        <p className="text-sm font-bold text-white">Двухфакторная аутентификация (2FA)</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Дополнительный слой защиты через Telegram/Google</p>
                      </div>
                      <div className="w-12 h-6 bg-neutral-800 rounded-full relative cursor-pointer opacity-50">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-600 rounded-full" />
                      </div>
                    </div>
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                      <p className="text-xs font-bold text-neutral-400 mb-2">История входов</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                           <span className="text-neutral-500 font-mono">192.168.1.1</span>
                           <span className="text-neutral-600 uppercase">Russia • Chrome • 2h ago</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-red-500/10 rounded-3xl p-6">
                    <h3 className="text-red-400 font-bold mb-2">Опасная зона</h3>
                    <p className="text-neutral-500 text-xs mb-4">После удаления аккаунта все ваши данные будут безвозвратно удалены.</p>
                    <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl px-4 py-2 text-xs font-bold transition-colors">
                      Удалить аккаунт
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {isElectron ? (
                      <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                        <h3 className="text-xl font-black text-white mb-6">Новая задача</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] uppercase font-black text-neutral-500 mb-2 block tracking-widest">Категория</label>
                            <select 
                              value={newTaskCategory}
                              onChange={(e) => setNewTaskCategory(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                            >
                              <option>SEO Parsing</option>
                              <option>Lead Generation</option>
                              <option>VLESS Management</option>
                              <option>Google Maps Scraper</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-black text-neutral-500 mb-2 block tracking-widest">Тип задачи</label>
                            <select 
                              value={newTaskService}
                              onChange={(e) => setNewTaskService(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                            >
                              <option>Deep SEO Scan</option>
                              <option>Telegram Contacts Export</option>
                              <option>Auto-VLESS Node Config</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-black text-neutral-500 mb-2 block tracking-widest">Параметры (URL/JSON/Key)</label>
                            <input 
                              type="text" 
                              value={newTaskKeyword}
                              onChange={(e) => setNewTaskKeyword(e.target.value)}
                              placeholder="Введите данные для обработки..." 
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-black text-neutral-500 mb-2 block tracking-widest">Лимит потоков</label>
                            <input 
                              type="number" 
                              value={newTaskLimit}
                              onChange={(e) => setNewTaskLimit(parseInt(e.target.value))}
                              placeholder="10" 
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" 
                            />
                          </div>
                          <div className="pt-4">
                            <button 
                              onClick={handleRunParser}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 font-black transition-all shadow-lg text-sm uppercase tracking-widest"
                            >
                              {!hasActivePlan ? "Нужна подписка" : "Запустить парсер"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="lg:col-span-1 bg-neutral-900 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group min-h-[400px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[40px] group-hover:bg-indigo-600/10 transition-all text-indigo-500/10"><Zap className="w-full h-full" /></div>
                        <div className="relative z-10 text-center">
                          <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Zap className="w-8 h-8 text-indigo-400" />
                          </div>
                          <h3 className="text-xl font-black text-white mb-3 tracking-tight">Запуск задач</h3>
                          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                            На сайте доступен просмотр истории и скачивание результатов. <span className="text-white font-bold">Лимиты и запуск</span> новых задач осуществляются через десктопное приложение.
                          </p>
                          <div className="space-y-3 mb-8">
                            {['Мониторинг прогресса', 'Выгрузка в CSV', 'Логи обработки'].map((item, i) => (
                              <div key={i} className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                                {item}
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => setActiveTab("download")}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 font-black transition-all shadow-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Скачать софт
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white">Список задач</h3>
                        <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                           <History className="w-3 h-3" /> История
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-neutral-500 border-b border-neutral-800">
                              <th className="pb-4 font-black uppercase tracking-widest">ID</th>
                              <th className="pb-4 font-black uppercase tracking-widest">Задача</th>
                              <th className="pb-4 font-black uppercase tracking-widest">Статус</th>
                              <th className="pb-4 font-black uppercase tracking-widest">Результат</th>
                            </tr>
                          </thead>
                          <tbody className="text-neutral-300">
                            {tasks.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-neutral-500 italic">Нет активных задач. Запустите их в приложении.</td>
                              </tr>
                            ) : (
                              tasks.map((task) => (
                                <tr key={task.id} className="border-b border-neutral-800/50">
                                  <td className="py-4 font-mono text-neutral-500 text-[10px]">#{task.id.slice(0, 8)}</td>
                                  <td className="py-4 font-bold">{task.service || task.category}: {task.link}</td>
                                  <td className="py-4 text-[10px]">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full font-bold uppercase",
                                      task.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-indigo-500/10 text-indigo-500"
                                    )}>
                                      {task.status === "completed" ? "ГОТОВО" : task.status || "В ОБРАБОТКЕ"}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    {task.status === "completed" ? (
                                      <a 
                                        href={`/api/results/export?taskId=${task.id}`}
                                        className="text-indigo-400 font-bold hover:underline flex items-center gap-1"
                                      >
                                        <Download className="w-3 h-3" /> CSV
                                      </a>
                                    ) : (
                                      <span className="text-neutral-500 italic text-[10px]">Обработка...</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "billing" && (
                <motion.div 
                  key="billing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                      <PricingPlans isLoggedIn={isLoggedIn} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "tickets" && (
                <motion.div key="tickets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                         <h3 className="text-2xl font-black text-white">Поддержка 24/7</h3>
                         <p className="text-xs text-neutral-500 mt-1">Ответ в течение 15-30 минут</p>
                       </div>
                       <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
                         <Plus className="w-4 h-4" /> Новый тикет
                       </button>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between group hover:border-neutral-700 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Проблема с активацией V1.0.4</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Тикет #129 - 2 часа назад</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">Ждет ответа</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "download" && (
                  <motion.div 
                    key="download"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto"
                  >
                    {!hasActivePlan ? (
                       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-16 text-center">
                         <ShieldCheck className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
                         <h2 className="text-2xl font-black text-white mb-4">Доступ закрыт</h2>
                         <p className="text-neutral-400 mb-8">Для скачивания приложения необходимо иметь активную подписку.</p>
                         <button 
                           onClick={() => setActiveTab("billing")}
                           className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg text-sm"
                         >
                           Перейти к тарифам
                         </button>
                       </div>
                    ) : (
                       <div className="bg-neutral-900 border border-indigo-500/30 rounded-3xl p-6 md:p-10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px]" />
                         <div className="relative z-10">
                           <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 mb-10">
                             <div>
                               <h2 className="text-3xl font-black text-white mb-2">Скачать Parser</h2>
                               <p className="text-neutral-400 text-sm">Версия 1.0.4 для Windows 10/11</p>
                             </div>
                             <a 
                              href="/api/download/desktop"
                               className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                             >
                               <Download className="w-6 h-6" /> .ZIP Архив
                             </a>
                           </div>

                           <div className="space-y-6">
                             <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6">
                               <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Инструкция по установке</h3>
                               <ol className="list-decimal list-inside space-y-3 text-sm text-neutral-400 leading-relaxed">
                                 <li>Скачайте архив по кнопке выше.</li>
                                 <li>Распакуйте его в удобную папку на компьютере.</li>
                                 <li>Запустите файл <span className="text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded">INSTALL_AND_RUN.bat</span>.</li>
                                 <li>Программа установит необходимые компоненты и откроется автоматически.</li>
                                 <li>Для авторизации используйте логин и пароль от этого кабинета.</li>
                               </ol>
                             </div>
                           </div>
                         </div>
                       </div>
                    )}
                  </motion.div>
              )}

              {activeTab === "admin" && user?.plan === "ADMIN" && (
                <motion.div 
                  key="admin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px]" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                       <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                          <Settings className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white">Админ-панель</h3>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Управление экосистемой</p>
                        </div>
                       </div>
                       <div className="flex gap-2">
                         <button className="bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold text-white">История промо</button>
                         <button className="bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold text-white">Логи API</button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-black/50 border border-neutral-800 rounded-2xl p-6">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart3 className="w-3 h-3 text-red-400" /> Статистика</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">Пользователей</span>
                              <span className="font-mono text-white">1,245</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">Обороты (24ч)</span>
                              <span className="font-mono text-emerald-400">+$240</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">Тикеты</span>
                              <span className="font-mono text-amber-400">12</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/50 border border-neutral-800 rounded-2xl p-6">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Ticket className="w-3 h-3 text-indigo-400" /> Создать промокод</h4>
                          <div className="space-y-3">
                            <input type="text" placeholder="CODE2024" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500" />
                            <div className="flex gap-2">
                              <input type="number" placeholder="%" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs outline-none" />
                              <input type="number" placeholder="Кол-во" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs outline-none" />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all">Создать</button>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 bg-black/50 border border-neutral-800 rounded-2xl p-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Users className="w-3 h-3 text-white" /> Недавние пользователи</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px]">
                            <thead>
                              <tr className="text-neutral-500 border-b border-neutral-800">
                                <th className="pb-3 font-black">User</th>
                                <th className="pb-3 font-black">Email</th>
                                <th className="pb-3 font-black">Plan</th>
                                <th className="pb-3 font-black text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-neutral-300">
                              {adminUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-4 text-center text-neutral-500 italic">Нет данных</td>
                                </tr>
                              ) : (
                                adminUsers.map((u) => (
                                  <tr key={u.id} className="border-b border-neutral-800/30">
                                    <td className="py-3 font-bold">{u.username}</td>
                                    <td className="py-3 text-neutral-500">{u.email || "—"}</td>
                                    <td className={cn(
                                      "py-3 font-mono",
                                      u.plan === "ADMIN" ? "text-red-400" : "text-emerald-400"
                                    )}>{u.plan}</td>
                                    <td className="py-3 text-right">
                                      <button className="text-indigo-400 font-bold hover:underline">Edit</button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-6 pt-6 border-t border-neutral-800">
                          <h4 className="text-[10px] font-black text-white uppercase mb-4 tracking-widest">Ручная выдача плана</h4>
                          <div className="flex flex-col sm:flex-row gap-2">
                             <input 
                               value={targetUserId}
                               onChange={(e) => setTargetUserId(e.target.value)}
                               type="text" 
                               placeholder="ID/Username" 
                               className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs" 
                             />
                             <select 
                               value={selectedGrantPlan}
                               onChange={(e) => setSelectedGrantPlan(e.target.value)}
                               className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-400"
                             >
                               <option value="1m">1 Month</option>
                               <option value="3m">3 Month</option>
                               <option value="1y">1 Year</option>
                               <option value="forever">Lifetime</option>
                               <option value="ADMIN">ADMIN</option>
                             </select>
                             <button 
                               onClick={handleGrantPlan}
                               className="bg-white text-black px-4 py-2.5 rounded-xl text-xs font-black hover:bg-neutral-200 transition-colors"
                             >
                               Grant
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
