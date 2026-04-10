import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEFAULT_TERMS } from '../utils/api'

interface HUDProps {
  currentQuery: string
  onQueryChange: (query: string) => void
  hoveredRegion: string | null
  isLoading: boolean
}

export default function HUD({ currentQuery, onQueryChange, hoveredRegion, isLoading }: HUDProps) {
  const [inputValue, setInputValue] = useState(currentQuery)
  const [showTerms, setShowTerms] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onQueryChange(inputValue.trim())
      setShowTerms(false)
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-start justify-between p-5">
          {/* Logo / Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-auto"
          >
            <h1 className="font-display text-xl font-bold tracking-tight">
              <span className="gradient-text">NeuroViz</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">
              Interactive 3D Brain Explorer
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="pointer-events-auto"
          >
            <form onSubmit={handleSubmit} className="relative">
              <div className="glass rounded-xl flex items-center gap-2 px-3 py-2 min-w-[280px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 flex-shrink-0">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setShowTerms(true)}
                  placeholder="Search cognitive function..."
                  className="bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none w-full font-body"
                />
                {isLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full flex-shrink-0"
                  />
                )}
              </div>

              {/* Term dropdown */}
              <AnimatePresence>
                {showTerms && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 right-0 glass-darker rounded-xl overflow-hidden max-h-[320px] overflow-y-auto"
                  >
                    <div className="p-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-600 px-2 py-1 font-mono">
                        Cognitive Functions
                      </p>
                      {DEFAULT_TERMS.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setInputValue(term)
                            onQueryChange(term)
                            setShowTerms(false)
                          }}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors
                            ${term === currentQuery
                              ? 'text-cyan-400 bg-cyan-500/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Click-away to close dropdown */}
            {showTerms && (
              <div
                className="fixed inset-0 -z-10"
                onClick={() => setShowTerms(false)}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Hovered region tooltip */}
      <AnimatePresence>
        {hoveredRegion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 pulse-glow" />
              <span className="text-sm font-medium text-slate-200 font-body">
                {hoveredRegion}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Click to explore
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active query badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-6 left-5 z-30 pointer-events-none"
      >
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
          <span>MAPPING:</span>
          <span className="text-cyan-500">{currentQuery.toUpperCase()}</span>
        </div>
      </motion.div>
    </>
  )
}
