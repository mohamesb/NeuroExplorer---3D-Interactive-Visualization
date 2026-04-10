import { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAIN_REGIONS } from '../data/brainRegions'
import { fetchBrainMesh, BrainMeshData } from '../utils/api'

interface BrainModelProps {
  activations: Record<string, { normalized: number }> | null
  hoveredRegion: string | null
  selectedRegion: string | null
  onHover: (name: string | null) => void
  onClick: (name: string) => void
  animationSpeed?: number
}

const SC = 80
function m2s(mni: [number, number, number]): [number, number, number] {
  return [(mni[0] - 25) / SC, (mni[2] - 10) / SC, -mni[1] / SC]
}

function heat(v: number): [number, number, number] {
  if (v < 0.2) return [0.15 + v, 0.25 + v * 2, 0.6 + v * 1.5]
  if (v < 0.4) { const t = (v - 0.2) / 0.2; return [0.35 + t * 0.25, 0.65 + t * 0.25, 0.9 - t * 0.2] }
  if (v < 0.6) { const t = (v - 0.4) / 0.2; return [0.6 + t * 0.3, 0.9 - t * 0.1, 0.7 - t * 0.4] }
  if (v < 0.8) { const t = (v - 0.6) / 0.2; return [0.9 + t * 0.1, 0.8 - t * 0.4, 0.3 - t * 0.15] }
  { const t = (v - 0.8) / 0.2; return [1, 0.4 - t * 0.25, 0.15 - t * 0.1] }
}

/**
 * Build a Three.js BufferGeometry from real FreeSurfer surface data.
 * FreeSurfer RAS: X=left/right, Y=posterior/anterior, Z=inferior/superior
 * Three.js: X=right, Y=up, Z=toward camera
 */
function buildRealHemisphere(
  vertices: number[][],
  faces: number[][],
  scale: number,
  offsetX: number,
) {
  const geo = new THREE.BufferGeometry()
  const vCount = vertices.length
  const fCount = faces.length

  // Convert FreeSurfer RAS to Three.js scene coordinates
  const positions = new Float32Array(vCount * 3)
  for (let i = 0; i < vCount; i++) {
    const [x, y, z] = vertices[i]
    // FreeSurfer: X=LR, Y=PA, Z=IS → Three.js: X=LR, Y=IS(up), Z=-PA(forward)
    positions[i * 3] = x * scale + offsetX
    positions[i * 3 + 1] = z * scale        // Z(up in FS) → Y(up in Three)
    positions[i * 3 + 2] = -y * scale       // Y(anterior in FS) → -Z(forward in Three)
  }

  // Triangle indices
  const indices = new Uint32Array(fCount * 3)
  for (let i = 0; i < fCount; i++) {
    indices[i * 3] = faces[i][0]
    indices[i * 3 + 1] = faces[i][1]
    indices[i * 3 + 2] = faces[i][2]
  }

  // Vertex colors — init to base light blue
  const colors = new Float32Array(vCount * 3)
  for (let i = 0; i < vCount; i++) {
    colors[i * 3] = 0.28
    colors[i * 3 + 1] = 0.50
    colors[i * 3 + 2] = 0.76
  }

  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  // Assign each vertex to nearest brain region
  const rIdx = new Int32Array(vCount)
  const rDist = new Float32Array(vCount)
  const centers = BRAIN_REGIONS.map(r => m2s(r.mni))

  for (let i = 0; i < vCount; i++) {
    const vx = positions[i * 3], vy = positions[i * 3 + 1], vz = positions[i * 3 + 2]
    let bd = 1e9, br = 0
    for (let r = 0; r < centers.length; r++) {
      const d2 = (vx - centers[r][0]) ** 2 + (vy - centers[r][1]) ** 2 + (vz - centers[r][2]) ** 2
      if (d2 < bd) { bd = d2; br = r }
    }
    rIdx[i] = br
    rDist[i] = Math.sqrt(bd)
  }

  return { geo, rIdx, rDist }
}

/** Real hemisphere mesh component */
function RealHemisphere({
  vertices, faces, scale, offsetX,
  activations, hoveredRegion, selectedRegion, onHover, onClick,
}: {
  vertices: number[][]; faces: number[][]; scale: number; offsetX: number
  activations: Record<string, { normalized: number }> | null
  hoveredRegion: string | null; selectedRegion: string | null
  onHover: (n: string | null) => void; onClick: (n: string) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { geo, rIdx, rDist } = useMemo(
    () => buildRealHemisphere(vertices, faces, scale, offsetX),
    [vertices, faces, scale, offsetX],
  )

  useFrame(() => {
    if (!meshRef.current) return
    const attr = geo.attributes.color as THREE.BufferAttribute
    const c = attr.array as Float32Array
    const hI = hoveredRegion ? BRAIN_REGIONS.findIndex(r => r.name === hoveredRegion) : -1
    const sI = selectedRegion ? BRAIN_REGIONS.findIndex(r => r.name === selectedRegion) : -1
    const now = performance.now()

    for (let i = 0; i < attr.count; i++) {
      const ri = rIdx[i], d = rDist[i]
      const act = activations?.[BRAIN_REGIONS[ri]?.name]?.normalized ?? 0
      const inf = Math.max(0, 1 - d / 0.42)
      let r = 0.28, g = 0.50, b = 0.76

      if (inf > 0.01 && act > 0.02) {
        const [hr, hg, hb] = heat(act)
        const s = inf * Math.pow(act, 0.5)
        r += (hr - r) * s; g += (hg - g) * s; b += (hb - b) * s
      }
      if (ri === hI && d < 0.30) {
        const s = Math.max(0, 1 - d / 0.30) * 0.55
        r += (0.3 - r) * s; g += (0.92 - g) * s; b += (1.0 - b) * s
      }
      if (ri === sI && d < 0.34) {
        const s = Math.max(0, 1 - d / 0.34) * 0.5
        r += (0.3 - r) * s; g += (0.92 - g) * s; b += (1.0 - b) * s
      }
      if (sI >= 0 && ri !== sI) {
        r += (0.1 - r) * 0.4; g += (0.14 - g) * 0.4; b += (0.22 - b) * 0.4
      }
      if (act > 0.5 && inf > 0.2) {
        const p = Math.sin(now * 0.003 + ri) * 0.07 * act
        r = Math.min(1, r + p); g = Math.min(1, g + p * 0.4)
      }
      c[i * 3] = r; c[i * 3 + 1] = g; c[i * 3 + 2] = b
    }
    attr.needsUpdate = true
  })

  const onPtr = useCallback((e: ThreeEvent<PointerEvent | MouseEvent>, mode: 'h' | 'c') => {
    e.stopPropagation()
    const f = e.face; if (!f) return
    const name = BRAIN_REGIONS[rIdx[f.a]]?.name; if (!name) return
    if (mode === 'h') { onHover(name); document.body.style.cursor = 'pointer' } else onClick(name)
  }, [rIdx, onHover, onClick])

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      onPointerMove={e => onPtr(e, 'h')}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      onClick={e => onPtr(e, 'c')}
    >
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.82}
        roughness={0.38}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Brainstem + cerebellum (simple procedural, these aren't in fsaverage) */
function Brainstem() {
  const sg = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.10, 0.065, 0.40, 18, 8)
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i)
      p.setZ(i, p.getZ(i) + y * 0.20)
      if (y > 0.08) {
        p.setX(i, p.getX(i) * (1 + (y - 0.08) * 2.2))
        p.setZ(i, p.getZ(i) * (1 + (y - 0.08) * 1.2))
      }
    }
    p.needsUpdate = true; g.computeVertexNormals(); return g
  }, [])
  const cg = useMemo(() => {
    const g = new THREE.SphereGeometry(0.28, 32, 24)
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      y *= 0.48; x *= 1.5; z *= 0.85
      const r = Math.sqrt(x * x + y * y + z * z) || 1
      const rd = Math.sin(y * 28) * 0.013 + Math.sin(y * 14 + x * 3) * 0.008
      p.setXYZ(i, x + (x / r) * rd, y + (y / r) * rd, z + (z / r) * rd)
    }
    p.needsUpdate = true; g.computeVertexNormals(); return g
  }, [])
  return (
    <group>
      <mesh geometry={sg} position={[0, -0.52, 0.10]} rotation={[0.14, 0, 0]}>
        <meshStandardMaterial color="#2e5580" transparent opacity={0.75} roughness={0.5} />
      </mesh>
      <mesh geometry={cg} position={[0, -0.40, 0.30]}>
        <meshStandardMaterial color="#2e5888" transparent opacity={0.70} roughness={0.45} />
      </mesh>
    </group>
  )
}

/** Floating activity particles near active regions */
function Particles({ activations }: { activations: Record<string, { normalized: number }> | null }) {
  const ref = useRef<THREE.Points>(null!)
  const N = 120
  const data = useMemo(() => {
    const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), links = new Int32Array(N)
    for (let i = 0; i < N; i++) {
      const ri = Math.floor(Math.random() * BRAIN_REGIONS.length), c = m2s(BRAIN_REGIONS[ri].mni)
      pos[i * 3] = c[0] + (Math.random() - 0.5) * 0.2
      pos[i * 3 + 1] = c[1] + (Math.random() - 0.5) * 0.2
      pos[i * 3 + 2] = c[2] + (Math.random() - 0.5) * 0.2
      vel[i * 3] = (Math.random() - 0.5) * 0.005
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005
      links[i] = ri
    }
    return { pos, vel, links }
  }, [])

  useFrame(() => {
    if (!ref.current || !activations) return
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const a = p.array as Float32Array
    for (let i = 0; i < N; i++) {
      const ri = data.links[i], act = activations[BRAIN_REGIONS[ri].name]?.normalized ?? 0
      if (act < 0.35) { a[i * 3 + 1] = -99; continue }
      const c = m2s(BRAIN_REGIONS[ri].mni), spd = act * 0.3
      a[i * 3] += data.vel[i * 3] * spd
      a[i * 3 + 1] += data.vel[i * 3 + 1] * spd
      a[i * 3 + 2] += data.vel[i * 3 + 2] * spd
      const dx = c[0] - a[i * 3], dy = c[1] - a[i * 3 + 1], dz = c[2] - a[i * 3 + 2]
      if (dx * dx + dy * dy + dz * dz > 0.04) {
        a[i * 3] += dx * 0.04; a[i * 3 + 1] += dy * 0.04; a[i * 3 + 2] += dz * 0.04
      }
      data.vel[i * 3] = data.vel[i * 3] * 0.95 + (Math.random() - 0.5) * 0.002
      data.vel[i * 3 + 1] = data.vel[i * 3 + 1] * 0.95 + (Math.random() - 0.5) * 0.002
      data.vel[i * 3 + 2] = data.vel[i * 3 + 2] * 0.95 + (Math.random() - 0.5) * 0.002
    }
    p.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={N} array={data.pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.012} color="#00f0ff" transparent opacity={0.45}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/** Main brain model — fetches real mesh data then renders */
export default function BrainModel({
  activations, hoveredRegion, selectedRegion, onHover, onClick, animationSpeed = 1,
}: BrainModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [meshData, setMeshData] = useState<BrainMeshData | null>(null)

  // Fetch real brain mesh on mount
  useEffect(() => {
    fetchBrainMesh()
      .then(setMeshData)
      .catch(err => console.error('Failed to load brain mesh:', err))
  }, [])

  // Auto-rotate when idle
  useFrame((_, dt) => {
    if (groupRef.current && !selectedRegion && !hoveredRegion)
      groupRef.current.rotation.y += dt * 0.05 * animationSpeed
  })

  // Compute scale to normalize the mesh to ~1.0 unit size
  const scale = useMemo(() => {
    if (!meshData) return 0.01
    const verts = meshData.lh.vertices
    let maxR = 0
    for (const [x, y, z] of verts) {
      const r = Math.sqrt(x * x + y * y + z * z)
      if (r > maxR) maxR = r
    }
    return 0.7 / maxR  // normalize so brain fits in ~0.7 unit radius
  }, [meshData])

  if (!meshData) {
    // Loading state — show a placeholder
    return (
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#2a4a6a" transparent opacity={0.3} wireframe />
      </mesh>
    )
  }

  return (
    <group ref={groupRef}>
      <RealHemisphere
        vertices={meshData.lh.vertices}
        faces={meshData.lh.faces}
        scale={scale}
        offsetX={0}
        activations={activations}
        hoveredRegion={hoveredRegion}
        selectedRegion={selectedRegion}
        onHover={onHover}
        onClick={onClick}
      />
      <RealHemisphere
        vertices={meshData.rh.vertices}
        faces={meshData.rh.faces}
        scale={scale}
        offsetX={0}
        activations={activations}
        hoveredRegion={hoveredRegion}
        selectedRegion={selectedRegion}
        onHover={onHover}
        onClick={onClick}
      />
      <Brainstem />
      <Particles activations={activations} />
    </group>
  )
}
