import { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

type NavItemProps = {
  active?: boolean;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
};

export function NavItem({ active = false, onClick, icon, label }: NavItemProps) {
  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl px-4 py-3 text-left text-xs font-bold transition-colors",
        active
          ? "bg-indigo-600/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_35px_rgba(79,70,229,0.24)]"
          : "text-neutral-400 hover:bg-white/[0.055] hover:text-white"
      )}
    >
      {active && (
        <motion.span
          layoutId="active-nav-glow"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.24),transparent_36%)]"
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
    </motion.button>
  );
}
