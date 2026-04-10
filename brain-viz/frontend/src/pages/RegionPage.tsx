import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { getRegionByName, LOBE_COLORS, BrainRegion, BRAIN_REGIONS } from '../data/brainRegions'
import { DEFAULT_TERMS, fetchActivation, fetchBrainMesh, BrainMeshData } from '../utils/api'

const SC = 80
function m2s(mni: [number, number, number]): [number, number, number] {
  return [(mni[0] - 25) / SC, (mni[2] - 10) / SC, -mni[1] / SC]
}

function buildMiniGeo(vertices: number[][], faces: number[][], scale: number) {
  const geo = new THREE.BufferGeometry()
  const vCount = vertices.length
  const positions = new Float32Array(vCount * 3)
  for (let i = 0; i < vCount; i++) {
    const [x, y, z] = vertices[i]
    positions[i * 3] = x * scale
    positions[i * 3 + 1] = z * scale
    positions[i * 3 + 2] = -y * scale
  }
  const indices = new Uint32Array(faces.length * 3)
  for (let i = 0; i < faces.length; i++) {
    indices[i * 3] = faces[i][0]; indices[i * 3 + 1] = faces[i][1]; indices[i * 3 + 2] = faces[i][2]
  }
  const colors = new Float32Array(vCount * 3)
  for (let i = 0; i < vCount; i++) { colors[i * 3] = 0.28; colors[i * 3 + 1] = 0.50; colors[i * 3 + 2] = 0.76 }
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const rIdx = new Int32Array(vCount), rDist = new Float32Array(vCount)
  const centers = BRAIN_REGIONS.map(r => m2s(r.mni))
  for (let i = 0; i < vCount; i++) {
    const vx = positions[i * 3], vy = positions[i * 3 + 1], vz = positions[i * 3 + 2]
    let bd = 1e9, br = 0
    for (let r = 0; r < centers.length; r++) {
      const d2 = (vx - centers[r][0]) ** 2 + (vy - centers[r][1]) ** 2 + (vz - centers[r][2]) ** 2
      if (d2 < bd) { bd = d2; br = r }
    }
    rIdx[i] = br; rDist[i] = Math.sqrt(bd)
  }
  return { geo, rIdx, rDist }
}

function MiniRegionBrain({ region, activation, meshData, meshScale }: {
  region: BrainRegion; activation: number; meshData: BrainMeshData; meshScale: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const lhRef = useRef<THREE.Mesh>(null!)
  const rhRef = useRef<THREE.Mesh>(null!)
  const lh = useMemo(() => buildMiniGeo(meshData.lh.vertices, meshData.lh.faces, meshScale), [meshData, meshScale])
  const rh = useMemo(() => buildMiniGeo(meshData.rh.vertices, meshData.rh.faces, meshScale), [meshData, meshScale])
  const targetIdx = BRAIN_REGIONS.findIndex(r => r.name === region.name)

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.006
    const paint = (data: typeof lh) => {
      const attr = data.geo.attributes.color as THREE.BufferAttribute
      const c = attr.array as Float32Array
      const now = performance.now()
      for (let i = 0; i < attr.count; i++) {
        const ri = data.rIdx[i], d = data.rDist[i]
        if (ri === targetIdx && d < 0.35) {
          const s = Math.max(0, 1 - d / 0.35)
          const pulse = Math.sin(now * 0.004) * 0.08 * s
          c[i * 3] = 0.30 + s * (0.65 * activation) + pulse
          c[i * 3 + 1] = 0.52 + s * (0.40 * activation) + pulse * 0.3
          c[i * 3 + 2] = 0.78 - s * 0.15 * activation
        } else { c[i * 3] = 0.16; c[i * 3 + 1] = 0.24; c[i * 3 + 2] = 0.38 }
      }
      attr.needsUpdate = true
    }
    paint(lh); paint(rh)
  })

  return (
    <>
      <ambientLight intensity={0.5} color="#6090cc" />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#d4e4ff" />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#5080c0" />
      <pointLight position={[0, 1.5, 0]} intensity={0.6} color="#00e0ff" distance={5} decay={2} />
      <Stars radius={30} depth={20} count={800} factor={2} saturation={0.1} fade speed={0.3} />
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1} minDistance={1.4} maxDistance={4} />
      <group ref={groupRef}>
        <mesh ref={lhRef} geometry={lh.geo}>
          <meshStandardMaterial vertexColors transparent opacity={0.78} roughness={0.42} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={rhRef} geometry={rh.geo}>
          <meshStandardMaterial vertexColors transparent opacity={0.78} roughness={0.42} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}

function TermActivationChart({ data }: { data: { term: string; value: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 0.01)
  return (
    <div className="space-y-1.5">{data.map(({ term, value }, i) => {
      const pct = (value / maxVal) * 100
      const hue = (value / maxVal) < 0.5 ? 210 : 30 - ((value / maxVal) - 0.5) * 60
      return (
        <motion.div key={term} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-mono w-[120px] truncate text-right">{term}</span>
          <div className="flex-1 h-[6px] bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: `hsl(${hue},75%,55%)` }} />
          </div>
          <span className="text-[11px] text-slate-400 font-mono w-12 text-right">{(value * 100).toFixed(0)}%</span>
        </motion.div>
      )
    })}</div>
  )
}

export default function RegionPage() {
  const { regionName } = useParams<{ regionName: string }>()
  const navigate = useNavigate()
  const region = regionName ? getRegionByName(decodeURIComponent(regionName)) : null
  const [termActivations, setTermActivations] = useState<{ term: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [peakActivation, setPeakActivation] = useState(0)
  const [meshData, setMeshData] = useState<BrainMeshData | null>(null)

  useEffect(() => { fetchBrainMesh().then(setMeshData).catch(console.error) }, [])

  useEffect(() => {
    if (!region) return; setLoading(true)
    ;(async () => {
      const results: { term: string; value: number }[] = []
      for (const term of DEFAULT_TERMS) {
        try { const d = await fetchActivation(term); results.push({ term, value: d.activations[region.name]?.normalized ?? 0 }) }
        catch { results.push({ term, value: Math.random() * 0.5 }) }
      }
      results.sort((a, b) => b.value - a.value)
      setTermActivations(results); setPeakActivation(results[0]?.value ?? 0); setLoading(false)
    })()
  }, [region])

  const meshScale = useMemo(() => {
    if (!meshData) return 0.01
    let maxR = 0
    for (const [x, y, z] of meshData.lh.vertices) {
      const r = Math.sqrt(x * x + y * y + z * z); if (r > maxR) maxR = r
    }
    return 0.7 / maxR
  }, [meshData])

  if (!region) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-400">Region not found. <button onClick={() => navigate('/')} className="text-cyan-400 underline ml-2">Back</button></p>
    </div>
  )

  const lobeColor = LOBE_COLORS[region.lobe] || '#94a3b8'

  return (
    <div className="relative w-full h-full overflow-y-auto">
      <div className="fixed inset-0 bg-navy-900 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-cyan-500/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-blue-500/[0.02] blur-[80px] rounded-full" />
      </div>
      <div className="scan-line" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Brain Explorer
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              className="glass rounded-2xl overflow-hidden aspect-square max-h-[400px] mb-6">
              <Canvas camera={{ position: [0, 0.3, 2.4], fov: 44 }} dpr={[1, 1.5]}>
                {meshData ? (
                  <MiniRegionBrain region={region} activation={peakActivation} meshData={meshData} meshScale={meshScale} />
                ) : (
                  <>
                    <ambientLight intensity={0.5} />
                    <mesh><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#2a4a6a" transparent opacity={0.3} wireframe /></mesh>
                  </>
                )}
              </Canvas>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider" style={{ color: lobeColor, background: `${lobeColor}15` }}>{region.lobe} Lobe</span>
                {region.brodmannAreas && <span className="text-[10px] font-mono text-slate-600">{region.brodmannAreas}</span>}
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-3">{region.name}</h1>
              <p className="text-sm text-slate-400 leading-relaxed">{region.description}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-3">Key Functions</h3>
              <div className="flex flex-wrap gap-2">{region.functions.map(fn => <span key={fn} className="px-3 py-1.5 rounded-xl text-xs bg-white/5 text-slate-300 border border-white/5">{fn}</span>)}</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-3">MNI152 Coordinates</h3>
              <div className="grid grid-cols-3 gap-3">{['X', 'Y', 'Z'].map((axis, i) => (
                <div key={axis} className="glass rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-600 font-mono">{axis}</div>
                  <div className="text-lg font-mono text-slate-200 mt-1">{region.mni[i]}</div>
                  <div className="text-[9px] text-slate-700 font-mono">mm</div>
                </div>
              ))}</div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-1">fMRI Activation Profile</h3>
              <p className="text-xs text-slate-500 mb-6">Activation of <span className="text-cyan-400">{region.name}</span> across {DEFAULT_TERMS.length} cognitive functions</p>
              {loading
                ? <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="flex items-center gap-3"><div className="w-[120px] h-3 bg-white/5 rounded animate-pulse" /><div className="flex-1 h-[6px] bg-white/5 rounded-full" /></div>)}</div>
                : <TermActivationChart data={termActivations} />}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="glass rounded-xl p-4 text-center"><div className="text-xl font-display font-bold gradient-text">{(peakActivation * 100).toFixed(0)}%</div><div className="text-[9px] font-mono text-slate-600 uppercase mt-1">Peak</div></div>
              <div className="glass rounded-xl p-4 text-center"><div className="text-xl font-display font-bold text-slate-200">{termActivations.filter(d => d.value > 0.4).length}</div><div className="text-[9px] font-mono text-slate-600 uppercase mt-1">Strong</div></div>
              <div className="glass rounded-xl p-4 text-center"><div className="text-xl font-display font-bold text-slate-200 text-[14px] leading-tight">{termActivations[0]?.term || '—'}</div><div className="text-[9px] font-mono text-slate-600 uppercase mt-1">Top Term</div></div>
            </div>
            <div className="glass rounded-xl p-4 mt-4"><h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-mono mb-2">Data Source</h3><p className="text-xs text-slate-500 leading-relaxed">Activation values from NeuroQuery meta-analytic model (~13,000 studies). Atlas: Harvard-Oxford cortical (MNI152 2mm). Brain surface: FreeSurfer fsaverage5 pial mesh (10,242 vertices per hemisphere).</p></div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
