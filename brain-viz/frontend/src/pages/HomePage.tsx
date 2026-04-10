import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import BrainScene from '../components/BrainScene'
import HUD from '../components/HUD'
import Sidebar from '../components/Sidebar'
import ActivityHeatmap from '../components/ActivityHeatmap'
import LoadingScreen from '../components/LoadingScreen'
import { fetchActivation, ActivationResponse } from '../utils/api'

export default function HomePage() {
  const [currentQuery, setCurrentQuery] = useState('motor')
  const [activations, setActivations] = useState<ActivationResponse['activations'] | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ready, setReady] = useState(false)

  // Load activation data
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetchActivation(currentQuery)
      .then((data) => {
        if (!cancelled) {
          setActivations(data.activations)
          setIsLoading(false)
          if (!ready) setTimeout(() => setReady(true), 600)
        }
      })
      .catch((err) => {
        console.error('Activation fetch failed:', err)
        if (!cancelled) {
          // Generate fallback data client-side
          const fallback = generateFallbackActivations(currentQuery)
          setActivations(fallback)
          setIsLoading(false)
          if (!ready) setTimeout(() => setReady(true), 600)
        }
      })

    return () => { cancelled = true }
  }, [currentQuery])

  const handleQueryChange = useCallback((query: string) => {
    setCurrentQuery(query)
    setSelectedRegion(null)
  }, [])

  const handleRegionClick = useCallback((name: string) => {
    setSelectedRegion((prev) => (prev === name ? null : name))
  }, [])

  if (!ready && isLoading) return <LoadingScreen />

  return (
    <div className="relative w-full h-full">
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-800/50 to-navy-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-blue-500/[0.02] blur-[80px] rounded-full" />
      </div>

      {/* 3D Canvas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-10"
      >
        <BrainScene
          activations={activations}
          hoveredRegion={hoveredRegion}
          selectedRegion={selectedRegion}
          onHover={setHoveredRegion}
          onClick={handleRegionClick}
        />
      </motion.div>

      {/* HUD overlay */}
      <HUD
        currentQuery={currentQuery}
        onQueryChange={handleQueryChange}
        hoveredRegion={hoveredRegion}
        isLoading={isLoading}
      />

      {/* Activity legend */}
      <ActivityHeatmap />

      {/* Sidebar */}
      <Sidebar
        selectedRegion={selectedRegion}
        activations={activations as any}
        onClose={() => setSelectedRegion(null)}
      />

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="fixed left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <div className="space-y-4">
          {activations && (
            <>
              <StatChip
                label="Regions"
                value={Object.keys(activations).length.toString()}
              />
              <StatChip
                label="Peak"
                value={`${(Math.max(...Object.values(activations).map(v => v.normalized)) * 100).toFixed(0)}%`}
              />
              <StatChip
                label="Active"
                value={Object.values(activations).filter(v => v.normalized > 0.4).length.toString()}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-display font-semibold text-slate-200">{value}</div>
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{label}</div>
    </div>
  )
}

/** Client-side fallback when backend is unavailable. */
function generateFallbackActivations(query: string): Record<string, { normalized: number; raw: number }> {
  const { BRAIN_REGIONS } = require('../data/brainRegions')

  const boostMap: Record<string, string[]> = {
    motor: ['Precentral Gyrus', 'Juxtapositional Lobule Cortex', 'Postcentral Gyrus'],
    visual: ['Occipital Pole', 'Intracalcarine Cortex', 'Cuneal Cortex', 'Lingual Gyrus'],
    auditory: ["Heschl's Gyrus", 'Planum Temporale', 'Superior Temporal Gyrus, posterior division'],
    language: ['Inferior Frontal Gyrus, pars triangularis', 'Inferior Frontal Gyrus, pars opercularis', 'Angular Gyrus'],
    memory: ['Parahippocampal Gyrus, anterior division', 'Precuneous Cortex', 'Cingulate Gyrus, posterior division'],
    emotion: ['Insular Cortex', 'Subcallosal Cortex', 'Cingulate Gyrus, anterior division', 'Frontal Orbital Cortex'],
    attention: ['Superior Parietal Lobule', 'Middle Frontal Gyrus', 'Frontal Pole'],
    pain: ['Insular Cortex', 'Cingulate Gyrus, anterior division', 'Postcentral Gyrus'],
    reward: ['Frontal Orbital Cortex', 'Subcallosal Cortex', 'Frontal Medial Cortex'],
    fear: ['Insular Cortex', 'Temporal Pole', 'Cingulate Gyrus, anterior division'],
    'decision making': ['Frontal Pole', 'Frontal Orbital Cortex', 'Middle Frontal Gyrus'],
    'face recognition': ['Temporal Fusiform Cortex, posterior division', 'Occipital Fusiform Gyrus'],
    reading: ['Angular Gyrus', 'Inferior Frontal Gyrus, pars triangularis'],
    music: ["Heschl's Gyrus", 'Planum Temporale', 'Superior Temporal Gyrus, anterior division'],
    speech: ['Inferior Frontal Gyrus, pars opercularis', 'Precentral Gyrus'],
    navigation: ['Parahippocampal Gyrus, posterior division', 'Precuneous Cortex', 'Superior Parietal Lobule'],
    'working memory': ['Middle Frontal Gyrus', 'Superior Parietal Lobule', 'Frontal Pole'],
    'social cognition': ['Temporal Pole', 'Frontal Medial Cortex', 'Cingulate Gyrus, posterior division'],
    'executive control': ['Middle Frontal Gyrus', 'Cingulate Gyrus, anterior division', 'Frontal Pole'],
    'default mode': ['Precuneous Cortex', 'Frontal Medial Cortex', 'Cingulate Gyrus, posterior division', 'Angular Gyrus'],
  }

  const boosted = new Set<string>()
  const ql = query.toLowerCase()
  for (const [kw, regions] of Object.entries(boostMap)) {
    if (ql.includes(kw)) regions.forEach(r => boosted.add(r))
  }
  if (boosted.size === 0) {
    // random boost for unknown terms
    const seed = Array.from(query).reduce((s, c) => s + c.charCodeAt(0), 0)
    const shuffled = [...BRAIN_REGIONS].sort((a: any, b: any) => {
      return ((a.name.charCodeAt(0) + seed) % 37) - ((b.name.charCodeAt(0) + seed) % 37)
    })
    shuffled.slice(0, 5).forEach((r: any) => boosted.add(r.name))
  }

  const result: Record<string, { normalized: number; raw: number }> = {}
  for (const r of BRAIN_REGIONS) {
    const isBoosted = boosted.has(r.name)
    const base = isBoosted
      ? 0.6 + Math.random() * 0.4
      : Math.random() * 0.35
    result[r.name] = {
      normalized: Math.round(base * 1000) / 1000,
      raw: Math.round((base * 6 - 1) * 100) / 100,
    }
  }
  return result
}
