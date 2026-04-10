import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Brain icon */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-neon-cyan/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-neon-blue/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neon-cyan">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.3" />
              <path d="M12 2c-2.5 0-4.5 4.48-4.5 10s2 10 4.5 10 4.5-4.48 4.5-10S14.5 2 12 2z" />
              <path d="M2 12h20" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold gradient-text mb-2">
            NeuroViz
          </h1>
          <motion.p
            className="text-sm text-slate-400 font-mono"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Initializing neural pathways...
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
