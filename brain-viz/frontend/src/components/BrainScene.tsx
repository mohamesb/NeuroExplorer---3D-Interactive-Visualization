import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei'
import BrainModel from './BrainModel'

interface BrainSceneProps {
  activations: Record<string, { normalized: number }> | null
  hoveredRegion: string | null
  selectedRegion: string | null
  onHover: (name: string | null) => void
  onClick: (name: string) => void
}

export default function BrainScene({
  activations, hoveredRegion, selectedRegion, onHover, onClick,
}: BrainSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 2.6], fov: 44, near: 0.1, far: 80 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <AdaptiveDpr pixelated />

      {/* ── Lighting tuned for a light-blue transparent brain ── */}
      {/* Cool ambient so the base blue reads clearly */}
      <ambientLight intensity={0.5} color="#6090cc" />

      {/* Key: top-right, strong, slightly warm to catch sulci ridges */}
      <directionalLight position={[5, 7, 4]} intensity={1.2} color="#d4e4ff" />

      {/* Fill: left-below, cool */}
      <directionalLight position={[-4, 1, -3]} intensity={0.45} color="#5080c0" />

      {/* Rim: behind, outlines silhouette */}
      <directionalLight position={[0, 4, -6]} intensity={0.6} color="#7098d0" />

      {/* Accent point lights for fMRI color pop */}
      <pointLight position={[0, 1.8, 0.5]} intensity={0.7} color="#00e0ff" distance={5} decay={2} />
      <pointLight position={[0.8, -0.5, -0.5]} intensity={0.3} color="#ff80b0" distance={4} decay={2} />
      <pointLight position={[-0.8, 0, 1]} intensity={0.25} color="#5090ff" distance={4} decay={2} />

      {/* Background stars */}
      <Stars radius={50} depth={40} count={2500} factor={3} saturation={0.12} fade speed={0.4} />

      {/* Orbit controls */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={5.5}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />

      <Suspense fallback={null}>
        <BrainModel
          activations={activations}
          hoveredRegion={hoveredRegion}
          selectedRegion={selectedRegion}
          onHover={onHover}
          onClick={onClick}
        />
      </Suspense>
    </Canvas>
  )
}
