import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type FeatureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  extendedDetail?: string;
};

export function FeatureModal({ isOpen, onClose, title, description, extendedDetail }: FeatureModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.12),transparent_28%)]"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#07070a]/90 p-1 shadow-[0_40px_120px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]"
            initial={{ opacity: 0, scale: 0.88, y: 34, rotateX: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 22, rotateX: 4 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_22%,rgba(99,102,241,0.08)_68%,transparent)]" />
            <div className="relative rounded-[28px] border border-white/[0.04] bg-black/35 p-6 sm:p-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <motion.div
                    className="mb-5 h-1.5 w-24 rounded-full bg-indigo-400"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.12, duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <h3 className="max-w-xl text-3xl font-black uppercase leading-none tracking-tighter text-white sm:text-5xl">
                    {title}
                  </h3>
                  <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-neutral-300 sm:text-base">{description}</p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 p-3 text-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-white/10 hover:text-white"
                  whileHover={{ scale: 1.06, rotate: 6 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
              {extendedDetail && (
                <motion.div
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm font-medium leading-7 text-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.35 }}
                >
                  {extendedDetail}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
