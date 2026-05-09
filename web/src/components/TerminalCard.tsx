import { ReactNode } from "react";
import { motion } from "motion/react";

type TerminalCardProps = {
  children?: ReactNode;
  className?: string;
};

export function TerminalCard({ children, className = "" }: TerminalCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050507]/85 p-4 font-mono text-xs text-emerald-300 shadow-[0_30px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)] ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      whileHover={{ rotateX: 2, rotateY: -2, y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
    >
      <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-auto text-[9px] font-black uppercase tracking-[0.28em] text-neutral-600">live</span>
      </div>
      <div className="relative z-10">{children}</div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.12),transparent_34%)]" />
    </motion.div>
  );
}
