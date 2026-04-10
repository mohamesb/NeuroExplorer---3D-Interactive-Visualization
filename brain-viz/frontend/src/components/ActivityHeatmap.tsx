import { motion } from 'framer-motion'

export default function ActivityHeatmap() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="fixed bottom-6 right-5 z-30 pointer-events-none"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Low</span>
        <div
          className="w-28 h-2 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #1e3a5f, #3b82f6, #00f0ff, #f59e0b, #ef4444)',
          }}
        />
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">High</span>
      </div>
      <p className="text-[9px] font-mono text-slate-700 mt-1 text-center">ACTIVATION INTENSITY</p>
    </motion.div>
  )
}
