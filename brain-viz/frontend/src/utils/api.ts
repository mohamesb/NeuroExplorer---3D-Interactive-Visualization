const API_BASE = '/api'

export interface RegionActivation {
  raw: number
  normalized: number
}

export interface ActivationResponse {
  query: string
  atlas: string
  region_count: number
  activations: Record<string, RegionActivation>
  source?: string
}

export interface RegionMeta {
  name: string
  description?: string
  mni_coordinates?: { x: number; y: number; z: number }
  hemisphere?: string
}

export interface RegionsResponse {
  atlas: string
  count: number
  regions: RegionMeta[]
}

export async function fetchActivation(query: string): Promise<ActivationResponse> {
  // Try NeuroQuery backend first, fall back to static simulation
  try {
    const res = await fetch(`${API_BASE}/activation/${encodeURIComponent(query)}`)
    if (res.ok) return res.json()
  } catch {}
  const res = await fetch(`${API_BASE}/activation-static/${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Failed to fetch activation for "${query}"`)
  return res.json()
}

export async function fetchRegions(): Promise<RegionsResponse> {
  const res = await fetch(`${API_BASE}/regions`)
  if (!res.ok) throw new Error('Failed to fetch regions')
  return res.json()
}

export async function fetchRegionDetail(name: string): Promise<RegionMeta> {
  const res = await fetch(`${API_BASE}/regions/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`Region "${name}" not found`)
  return res.json()
}

export async function fetchTerms(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/terms`)
  if (!res.ok) return DEFAULT_TERMS
  const data = await res.json()
  return data.terms
}

export const DEFAULT_TERMS = [
  'motor', 'visual', 'auditory', 'language', 'memory', 'emotion',
  'attention', 'pain', 'reward', 'fear', 'decision making',
  'working memory', 'face recognition', 'reading', 'music',
  'speech', 'navigation', 'social cognition', 'executive control',
  'default mode',
]

export const BRAIN_GLB_URL = `${API_BASE}/mesh/brain.glb`
export const BRAIN_MESH_URL = `${API_BASE}/mesh/brain.json`

export interface BrainMeshData {
  lh: { vertices: number[][]; faces: number[][] }
  rh: { vertices: number[][]; faces: number[][] }
}

export async function fetchBrainMesh(): Promise<BrainMeshData> {
  const res = await fetch(BRAIN_MESH_URL)
  if (!res.ok) throw new Error('Failed to fetch brain mesh')
  return res.json()
}
