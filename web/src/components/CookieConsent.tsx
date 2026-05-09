import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, X } from "lucide-react";

export const CookieConsent = ({ lang = 'ru' }: { lang?: 'ru' | 'en' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  const t = {
    ru: {
      title: "Файлы Cookie",
      desc: "Мы используем файлы cookie для обеспечения безопасности и стабильности работы личного кабинета. Продолжая использование сайта, вы соглашаетесь с нашей политикой.",
      accept: "Принимаю",
      later: "Позже"
    },
    en: {
      title: "Cookie Consent",
      desc: "We use cookies to ensure the security and stability of your account. By continuing to use the site, you agree to our cookie policy.",
      accept: "Accept",
      later: "Later"
    }
  }[lang];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[250]"
        >
          <div className="bg-[#111111]/90 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{t.title}</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
                  {t.desc}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAccept}
                    className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    {t.accept}
                  </button>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="px-4 border border-white/10 text-neutral-400 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    {t.later}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
