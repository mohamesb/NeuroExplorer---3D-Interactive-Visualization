import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getRegionByName, LOBE_COLORS } from '../data/brainRegions'

interface SidebarProps {
  selectedRegion: string | null
  activations: Record<string, { normalized: number; raw: number }> | null
  onClose: () => void
}

function ActivationBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  const hue = value < 0.5 ? 210 + (1 - value * 2) * 30 : 30 - (value - 0.5) * 60
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-slate-500 font-mono w-[140px] truncate">{label}</span>
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: `hsl(${hue}, 80%, 55%)` }}
        />
      </div>
      <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  )
}

export default function Sidebar({ selectedRegion, activations, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const region = selectedRegion ? getRegionByName(selectedRegion) : null
  const activation = selectedRegion && activations ? activations[selectedRegion] : null

  // Get top co-activated regions
  const topRegions = activations
    ? Object.entries(activations)
        .sort((a, b) => b[1].normalized - a[1].normalized)
        .slice(0, 8)
    : []

  return (
    <AnimatePresence>
      {selectedRegion && region && (
        <motion.aside
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 bottom-0 w-[380px] z-40 glass-darker overflow-y-auto"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                style={{
                  color: LOBE_COLORS[region.lobe] || '#94a3b8',
                  background: `${LOBE_COLORS[region.lobe] || '#94a3b8'}15`,
                }}
              >
                {region.lobe} Lobe
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-300"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="font-display text-lg font-semibold text-slate-100 leading-tight">
              {region.name}
            </h2>
            {region.brodmannAreas && (
              <p className="text-[11px] font-mono text-slate-500 mt-1">{region.brodmannAreas}</p>
            )}
          </div>

          {/* Activation */}
          {activation && (
            <div className="p-5 border-b border-white/5">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-3">
                Activation Level
              </h3>
              <div className="flex items-end gap-4">
                <div className="text-3xl font-display font-bold gradient-text">
                  {(activation.normalized * 100).toFixed(0)}%
                </div>
                <div className="text-[11px] font-mono text-slate-500 pb-1">
                  z = {activation.raw.toFixed(2)}
                </div>
              </div>
              <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activation.normalized * 100}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: `linear-gradient(90deg, #3b82f6, #00f0ff, #f59e0b, #ef4444)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-5 border-b border-white/5">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-body">
              {region.description}
            </p>
          </div>

          {/* Functions */}
          <div className="p-5 border-b border-white/5">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-3">
              Key Functions
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {region.functions.map((fn) => (
                <span
                  key={fn}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-slate-300 border border-white/5"
                >
                  {fn}
                </span>
              ))}
            </div>
          </div>

          {/* MNI Coordinates */}
          <div className="p-5 border-b border-white/5">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-3">
              MNI Coordinates
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <div key={axis} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] text-slate-600 font-mono">{axis}</div>
                  <div className="text-sm font-mono text-slate-300 mt-0.5">{region.mni[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Co-activated regions */}
          {topRegions.length > 0 && (
            <div className="p-5 border-b border-white/5">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-3">
                Top Activated Regions
              </h3>
              <div className="space-y-2">
                {topRegions.map(([name, val]) => (
                  <ActivationBar key={name} label={name} value={val.normalized} />
                ))}
              </div>
            </div>
          )}

          {/* Navigate to detail page */}
          <div className="p-5">
            <button
              onClick={() => navigate(`/region/${encodeURIComponent(region.name)}`)}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all
                bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30
                border border-cyan-500/20 text-cyan-400 hover:text-cyan-300"
            >
              View Full Details →
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
