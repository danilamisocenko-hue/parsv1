import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { Search, ChevronRight, Zap, Terminal, Cpu, Globe, Database, ArrowRight, Shield, Maximize, Activity, Server, Plus } from "lucide-react";
import { TopLevelView } from "../types";
import { TerminalCard } from "../components/TerminalCard";
import { PricingPlans } from "../components/PricingPlans";
import { cn } from "../lib/utils";
import { InteractiveCanvas } from "../components/InteractiveCanvas";
import { FeatureModal } from "../components/FeatureModal";
import { PolicyModal, PolicyType } from "../components/PolicyModal";
import { CookieConsent } from "../components/CookieConsent";

const TiltCard = ({ children, className, onClick, id }: { children: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent) => void, id?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
    glowX.set(mouseX);
    glowY.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      id={id}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative group rounded-[24px] sm:rounded-[32px] overflow-hidden bg-white/[0.015] border border-white/[0.04] backdrop-blur-3xl transition-all duration-500 hover:border-white/10 hover:bg-white/[0.03] shadow-[0_4px_24px_0_rgba(0,0,0,0.2)] cursor-pointer", className)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${glowX}px ${glowY}px,
              rgba(99,102,241,0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div style={{ transform: "translateZ(50px)" }} className="relative z-20 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export function LandingPage({ onNavigate }: { onNavigate: (view: TopLevelView) => void }) {
  const { scrollYProgress } = useScroll();
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '', extendedDetail: '' });
  
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyType, setPolicyType] = useState<PolicyType>('terms');

  const dict = {
    ru: {
      hero: {
        badge: "Самые быстрые услуги по минимальным ценам",
        title1: "АБСОЛЮТНЫЙ",
        title2: "КОНТРОЛЬ ДАННЫХ",
        desc: "Самый качественный поставщик услуг автоматизации и сбора данных. Мы обеспечиваем скорость, безопасность и анонимность на максималках.",
        btn1: "ПОДКЛЮЧИТЬСЯ",
        btn2: "ТАРИФЫ"
      },
      nav: {
        lk: "Личный кабинет",
        terms: "Условия",
        privacy: "Политика",
        contacts: "Контакты"
      },
      bento: {
        title: "Наши преимущества",
        subtitle: "Безупречная архитектура, созданная для максимальной эффективности.",
        f1: { t: "Удобная панель", d: "Наша панель использует все современные технологии, обеспечивая высочайшую скорость работы." },
        f2: { t: "Перепродавайте", d: "Предоставляем все условия для удобства реселлерам. Арендуйте мощности оптом." },
        f3: { t: "Лучшие цены", d: "Покупайте услуги с самых первых рук без наценок за платформу." },
        f4: { t: "Высшее качество", d: "Аптайм 99.9%. Мы постоянно следим за качеством предоставляемых услуг." },
        f5: { t: "Скидки", d: "Накопительная система скидок и лучшие предложения для активных пользователей." },
        f6: { t: "Поддержка 24/7", d: "Круглосуточная помощь специалистов через систему тикетов." }
      },
      pricing: {
        title: "Тарифы",
        subtitle: "Начните мощную генерацию потока данных прямо сейчас."
      }
    },
    en: {
      hero: {
        badge: "Fastest services at minimum prices",
        title1: "ABSOLUTE",
        title2: "DATA CONTROL",
        desc: "Top-tier automation and data collection provider. We ensure speed, security, and anonymity at peak performance.",
        btn1: "CONNECT NOW",
        btn2: "PRICING"
      },
      nav: {
        lk: "Control Panel",
        terms: "Terms",
        privacy: "Privacy",
        contacts: "Contacts"
      },
      bento: {
        title: "Our Advantages",
        subtitle: "Impeccable architecture designed for maximum efficiency.",
        f1: { t: "User Dashboard", d: "Our panel utilizes cutting-edge tech for lightning-fast operations." },
        f2: { t: "Reseller Friendly", d: "We provide all conditions for resellers. Rent capacities in bulk." },
        f3: { t: "Best Prices", d: "Buy services directly from the source without platform surcharges." },
        f4: { t: "Top Quality", d: "99.9% Uptime. We constantly monitor the quality of services provided." },
        f5: { t: "Discounts", d: "Cumulative discount system and best deals for active users." },
        f6: { t: "24/7 Support", d: "Round-the-clock professional help through our ticket system." }
      },
      pricing: {
        title: "Pricing",
        subtitle: "Start powerful data generation stream right now."
      }
    }
  };

  const t = dict[lang];

  const openFeature = (title: string, description: string, extendedDetail: string) => {
    setModalContent({ title, description, extendedDetail });
    setModalOpen(true);
  };

  const openPolicy = (type: PolicyType) => {
    setPolicyType(type);
    setPolicyOpen(true);
  };

  const cursorXLight = useSpring(mouseX, { stiffness: 1000, damping: 50 });
  const cursorYLight = useSpring(mouseY, { stiffness: 1000, damping: 50 });
  
  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  return (
    <div onMouseMove={handleMouseMove} className="min-h-screen bg-[#000000] text-neutral-200 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans cursor-default sm:cursor-none">
      
      <FeatureModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalContent.title} 
        description={modalContent.description} 
        extendedDetail={modalContent.extendedDetail} 
      />

      <PolicyModal 
        isOpen={policyOpen} 
        onClose={() => setPolicyOpen(false)} 
        type={policyType} 
      />

      <CookieConsent lang={lang} />

      <InteractiveCanvas />
      
      <motion.div 
        className="hidden sm:block pointer-events-none fixed z-[9999] w-4 h-4 bg-white rounded-full mix-blend-difference"
        style={{
           left: cursorXLight,
           top: cursorYLight,
           transform: "translate(-50%, -50%)"
        }}
      />
      {/* Interactive Global Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              1000px circle at ${mouseX}px ${mouseY}px,
              rgba(79,70,229,0.07),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[150px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]" />
      </div>
      
      {/* Interactive Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTM5LjUgMGguNXY0MGgtLjVWMHptLTIwIDBoLjV2NDBoLS41VjB6bS0xOSAwaC41djQwaC0uNVYwem0tTMzOS41IDQwSDB2LS41NDB2LjV6bS0yMCAwaC0uNVYwaC41djQweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDMzIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_20%,transparent_100%)] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-[8px] sm:rounded-[12px] flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white opacity-80" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white opacity-50" />
                </div>
              </div>
              <span className="text-lg sm:text-2xl font-black tracking-tighter text-white">FRESKO<span className="text-indigo-500">.CT</span></span>
            </div>
            
            <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 sm:p-1 gap-0.5 sm:gap-1">
              <button 
                onClick={() => setLang('ru')}
                className={cn("text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full transition-all", lang === 'ru' ? "bg-white text-black" : "text-neutral-400 hover:text-white")}
              >RU</button>
              <button 
                onClick={() => setLang('en')}
                className={cn("text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full transition-all", lang === 'en' ? "bg-white text-black" : "text-neutral-400 hover:text-white")}
              >EN</button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 sm:gap-6">
            <button 
              onClick={(e) => {
                window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
                setTimeout(() => {
                  onNavigate("auth");
                }, 400);
              }}
              className="text-xs sm:text-sm font-bold text-white hover:text-indigo-400 transition-colors bg-white/5 hover:bg-white/10 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-white/10 shadow-lg"
            >
              {t.nav.lk}
            </button>
            <button onClick={() => openPolicy('terms')} className="text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors hidden lg:block">{t.nav.terms}</button>
            <button onClick={() => openPolicy('privacy')} className="text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors hidden lg:block">{t.nav.privacy}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-20 md:pb-32 px-6 min-h-screen flex text-center flex-col items-center justify-center z-10 perspective-1000">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto relative w-full flex flex-col items-center"
        >
          <div className="inline-flex flex-col items-center justify-center w-full">
             <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-8 md:mb-10 backdrop-blur-md shadow-[0_0_20px_rgba(79,70,229,0.2)] mx-auto text-center">
               <Zap className="w-3 md:w-4 h-3 md:h-4 fill-indigo-400 shrink-0" /> {t.hero.badge}
             </div>
             
             <h1 className="text-[10vw] sm:text-[10vw] md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 text-center" style={{ transform: "skewX(-2deg)" }}>
               {t.hero.title1} <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-600 block mt-2">{t.hero.title2}</span>
             </h1>
             
             <p className="text-sm sm:text-base md:text-xl text-neutral-400 mb-10 md:mb-12 max-w-[300px] sm:max-w-xl md:max-w-2xl leading-relaxed font-medium mx-auto px-4">
               {t.hero.desc}
             </p>
             
             <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center w-full mt-6 px-4">
               <button 
                 onClick={(e) => {
                   window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'primary' } }));
                   setTimeout(() => {
                     onNavigate("auth");
                   }, 600);
                 }}
                 className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black px-8 md:px-10 py-4 md:py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] text-[11px] md:text-[13px] group relative overflow-hidden"
               >
                 <span className="relative z-10 flex items-center justify-center gap-3">
                   {t.hero.btn1} <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-1" />
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
               </button>
               <button 
                 onClick={(e) => {
                   window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
                   setTimeout(() => {
                     document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                   }, 300);
                 }}
                 className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 md:px-10 py-4 md:py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 text-[11px] md:text-[13px] backdrop-blur-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group relative overflow-hidden"
               >
                 <span className="relative z-10">{t.hero.btn2}</span>
               </button>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Features */}
      <div id="bento" className="py-20 md:py-32 px-4 sm:px-6 relative z-10 perspective-1000">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase" style={{ transform: "skewX(-2deg)" }}>{t.bento.title}</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-base md:text-xl font-medium">{t.bento.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[220px]">
             {/* Удобная панель */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature(t.bento.f1.t, t.bento.f1.d, 'We developed a fully custom ecosystem that allows you to quickly launch and control processes, ensuring high stability.'), 650);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-6 md:p-8 flex flex-col text-left items-start justify-center overflow-hidden">
               <div className="absolute right-[-10%] bottom-[-20%] text-white/5 pointer-events-none">
                 <Terminal className="w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter">{t.bento.f1.t}</h3>
                   <p className="text-neutral-400 text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed max-w-xs">{t.bento.f1.d}</p>
                 </div>
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex shrink-0">
                   <ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-white" />
                 </div>
               </div>
             </TiltCard>

             {/* Перепродавайте */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature(t.bento.f2.t, t.bento.f2.d, 'Special API keys and flexible billing settings will allow you to easily integrate our services into your projects under your own brand.'), 650);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-6 md:p-8 flex flex-col text-left items-start justify-center overflow-hidden">
               <div className="absolute right-[-10%] bottom-[-20%] text-white/5 pointer-events-none">
                 <Globe className="w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter">{t.bento.f2.t}</h3>
                   <p className="text-neutral-400 text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed max-w-xs">{t.bento.f2.d}</p>
                 </div>
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex shrink-0">
                   <ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-white" />
                 </div>
               </div>
             </TiltCard>

             {/* Лучшие цены */}
             <TiltCard id="best-prices" onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature(t.bento.f3.t, t.bento.f3.d, 'Since we own the infrastructure and do not use intermediaries, our prices consistently remain below market levels.'), 650);
             }} className="col-span-1 lg:col-span-2 row-span-1 md:row-span-2 p-6 sm:p-8 md:p-10 flex flex-col items-start justify-start relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent z-10" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] opacity-30 z-0 flex items-center justify-center pointer-events-none transition-transform duration-700 group-hover:scale-110">
                 <div className="absolute w-[80%] h-[80%] bg-indigo-500/10 blur-[80px] rounded-full" />
                 <Database className="w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 text-indigo-400/20 absolute" />
               </div>
               <div className="relative z-20 w-full">
                 <div className="flex items-start justify-between">
                   <div>
                     <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-white mb-3 uppercase tracking-tighter">{t.bento.f3.t}</h3>
                     <p className="text-neutral-300 text-xs sm:text-sm md:text-lg font-medium max-w-sm">{t.bento.f3.d}</p>
                   </div>
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all hidden sm:flex shrink-0">
                     <ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-white" />
                   </div>
                 </div>
               </div>
             </TiltCard>

             {/* Высшее качество */}
             <TiltCard id="high-quality" onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature(t.bento.f4.t, t.bento.f4.d, 'Proxy rotation algorithms, anti-detection protection, and a 99.9% uptime guarantee. In case of failure, we return funds automatically.'), 650);
             }} className="col-span-1 lg:col-span-2 row-span-1 md:row-span-2 p-6 sm:p-8 md:p-10 flex flex-col items-start justify-start relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent z-10" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] opacity-30 z-0 flex items-center justify-center pointer-events-none transition-transform duration-700 group-hover:scale-110">
                 <div className="absolute w-[80%] h-[80%] bg-purple-500/10 blur-[80px] rounded-full" />
                 <Shield className="w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 text-purple-400/20 absolute" />
               </div>
               <div className="relative z-20 w-full">
                 <div className="flex items-start justify-between">
                   <div>
                     <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-white mb-3 uppercase tracking-tighter">{t.bento.f4.t}</h3>
                     <p className="text-neutral-300 text-xs sm:text-sm md:text-lg font-medium max-w-sm">{t.bento.f4.d}</p>
                   </div>
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all hidden sm:flex shrink-0">
                     <ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-white" />
                   </div>
                 </div>
               </div>
             </TiltCard>

             {/* Скидки */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature(t.bento.f5.t, t.bento.f5.d, 'Flexible discount system for extending subscriptions for long-term cooperation.'), 650);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-6 md:p-8 flex flex-col text-left items-start justify-center overflow-hidden">
                 <div className="absolute right-[-10%] top-[-20%] text-white/5 pointer-events-none">
                  <Activity className="w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64" />
                </div>
                <div className="relative z-10 w-full flex items-center justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter">{t.bento.f5.t}</h3>
                    <p className="text-neutral-400 text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed max-w-xs">{t.bento.f5.d}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex shrink-0">
                    <ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                </div>
             </TiltCard>

             {/* Поддержка 24/7 */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature(t.bento.f6.t, t.bento.f6.d, 'Our engineers are always in touch. The average response time in messengers does not exceed two minutes.'), 650);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-6 md:p-8 flex flex-col text-left items-start justify-center overflow-hidden">
               <div className="absolute right-[-10%] top-[-20%] text-white/5 pointer-events-none">
                 <Server className="w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter">{t.bento.f6.t}</h3>
                   <p className="text-neutral-400 text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed max-w-xs">{t.bento.f6.d}</p>
                 </div>
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex shrink-0">
                   <ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-white" />
                 </div>
               </div>
             </TiltCard>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-20 md:py-32 px-4 sm:px-6 border-t border-white/5 relative z-10 backdrop-blur-md bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase" style={{ transform: "skewX(-2deg)" }}>{t.pricing.title}</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-base md:text-xl font-medium">{t.pricing.subtitle}</p>
          </div>
          <div className="relative px-2 sm:px-0">
             <PricingPlans isLoggedIn={false} isEnglish={lang === 'en'} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 text-center relative z-10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] border border-indigo-400/20 mb-8 opacity-80 mix-blend-screen">
             <div className="flex items-center gap-1 md:gap-1.5">
               <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-white opacity-80" />
               <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-white opacity-50" />
             </div>
           </div>
           <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase mb-4 opacity-50">FRESKO.CT</h2>
           <p className="text-[10px] md:text-sm font-bold text-neutral-600 uppercase tracking-[0.3em] mb-10">{t.hero.desc.split('.')[0]}</p>
           
           <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-500 mb-12">
             <button onClick={() => openPolicy('terms')} className="hover:text-white transition-colors">{t.nav.terms}</button>
             <button onClick={() => openPolicy('privacy')} className="hover:text-white transition-colors">{t.nav.privacy}</button>
             <a href="https://t.me/Fresko_CT" target="_blank" className="hover:text-white transition-colors">Telegram</a>
           </div>
           
           <div className="mt-4 text-[9px] md:text-[10px] text-neutral-700 font-mono">
             © 2026 FRESKO.CT PANEL. BUILD 1.0.6
           </div>
        </div>
      </footer>
    </div>
  );
}
