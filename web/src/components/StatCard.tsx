import { ReactNode } from "react";
import { motion } from "motion/react";

type StatCardProps = {
  icon?: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ icon, label, value, hint }: StatCardProps) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.16),transparent_42%)]" />
      <div className="relative z-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
        {icon && <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-indigo-300">{icon}</div>}
      </div>
      <p className="text-2xl font-black tracking-tight text-white">{value}</p>
      {hint && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{hint}</p>}
      </div>
    </motion.div>
  );
}
