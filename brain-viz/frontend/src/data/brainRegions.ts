export interface BrainRegion {
  name: string
  mni: [number, number, number]
  description: string
  functions: string[]
  brodmannAreas?: string
  lobe: string
}

export const BRAIN_REGIONS: BrainRegion[] = [
  { name: "Frontal Pole", mni: [0, 62, -4], lobe: "Frontal", brodmannAreas: "BA 10", functions: ["Planning", "Decision making", "Working memory"], description: "The most anterior part of the prefrontal cortex, involved in planning, decision making, and prospective memory." },
  { name: "Insular Cortex", mni: [38, 6, -2], lobe: "Insular", brodmannAreas: "BA 13, 14", functions: ["Interoception", "Emotion", "Taste", "Pain"], description: "Deep cortical region processing interoception, emotion, and taste. Key hub for awareness of bodily states." },
  { name: "Superior Frontal Gyrus", mni: [8, 32, 50], lobe: "Frontal", brodmannAreas: "BA 6, 8, 9", functions: ["Self-awareness", "Higher cognition", "Working memory"], description: "Contributes to self-awareness, higher cognitive functions, and working memory." },
  { name: "Middle Frontal Gyrus", mni: [38, 28, 36], lobe: "Frontal", brodmannAreas: "BA 9, 46", functions: ["Attention", "Working memory", "Executive function"], description: "Involved in attention, working memory, and executive function. Part of the dorsolateral prefrontal cortex." },
  { name: "Inferior Frontal Gyrus, pars triangularis", mni: [50, 26, 10], lobe: "Frontal", brodmannAreas: "BA 45", functions: ["Language production", "Semantic processing"], description: "Part of Broca's area. Critical for language production and semantic processing." },
  { name: "Inferior Frontal Gyrus, pars opercularis", mni: [50, 14, 18], lobe: "Frontal", brodmannAreas: "BA 44", functions: ["Speech production", "Syntactic processing"], description: "Part of Broca's area. Involved in speech production and syntactic processing." },
  { name: "Precentral Gyrus", mni: [38, -6, 52], lobe: "Frontal", brodmannAreas: "BA 4, 6", functions: ["Voluntary movement", "Motor control"], description: "Primary motor cortex. Controls voluntary movement of the contralateral body." },
  { name: "Temporal Pole", mni: [40, 14, -32], lobe: "Temporal", brodmannAreas: "BA 38", functions: ["Semantic memory", "Social cognition", "Emotion"], description: "Involved in semantic memory, social cognition, and emotion processing." },
  { name: "Superior Temporal Gyrus, anterior division", mni: [56, -2, -8], lobe: "Temporal", brodmannAreas: "BA 22, 38", functions: ["Auditory processing", "Speech comprehension"], description: "Processes complex auditory stimuli and speech comprehension." },
  { name: "Superior Temporal Gyrus, posterior division", mni: [60, -24, 2], lobe: "Temporal", brodmannAreas: "BA 22, 42", functions: ["Language comprehension", "Wernicke's area"], description: "Contains Wernicke's area. Critical for language comprehension." },
  { name: "Middle Temporal Gyrus, anterior division", mni: [58, -6, -22], lobe: "Temporal", brodmannAreas: "BA 21", functions: ["Semantic processing", "Language", "Face recognition"], description: "Involved in semantic processing, language, and face recognition." },
  { name: "Middle Temporal Gyrus, posterior division", mni: [62, -30, -8], lobe: "Temporal", brodmannAreas: "BA 21, 37", functions: ["Visual motion", "Language comprehension", "Reading"], description: "Processes visual motion, language comprehension, and reading." },
  { name: "Postcentral Gyrus", mni: [42, -28, 52], lobe: "Parietal", brodmannAreas: "BA 1, 2, 3", functions: ["Touch", "Pressure", "Pain", "Temperature"], description: "Primary somatosensory cortex. Processes touch, pressure, pain, and temperature." },
  { name: "Superior Parietal Lobule", mni: [24, -52, 60], lobe: "Parietal", brodmannAreas: "BA 5, 7", functions: ["Spatial orientation", "Visuospatial processing", "Attention"], description: "Involved in spatial orientation, visuospatial processing, and attention." },
  { name: "Supramarginal Gyrus, anterior division", mni: [56, -30, 38], lobe: "Parietal", brodmannAreas: "BA 40", functions: ["Phonological processing", "Reading", "Tactile perception"], description: "Involved in phonological processing, reading, and tactile perception." },
  { name: "Angular Gyrus", mni: [50, -54, 26], lobe: "Parietal", brodmannAreas: "BA 39", functions: ["Reading", "Arithmetic", "Spatial cognition", "Semantic processing"], description: "Key region for reading, arithmetic, spatial cognition, and semantic processing." },
  { name: "Lateral Occipital Cortex, superior division", mni: [34, -72, 30], lobe: "Occipital", brodmannAreas: "BA 19", functions: ["Visual object recognition", "Spatial perception"], description: "Processes visual object recognition and spatial perception." },
  { name: "Intracalcarine Cortex", mni: [8, -76, 8], lobe: "Occipital", brodmannAreas: "BA 17", functions: ["Primary visual processing"], description: "Contains primary visual cortex (V1). First cortical area to process visual input." },
  { name: "Frontal Medial Cortex", mni: [2, 46, -14], lobe: "Frontal", brodmannAreas: "BA 10, 11", functions: ["Self-referential thought", "Default mode network"], description: "Part of the default mode network. Involved in self-referential thought and social cognition." },
  { name: "Juxtapositional Lobule Cortex", mni: [4, -2, 58], lobe: "Frontal", brodmannAreas: "BA 6", functions: ["Motor planning", "Complex motor sequences"], description: "Supplementary motor area. Plans complex motor sequences." },
  { name: "Cingulate Gyrus, anterior division", mni: [4, 20, 26], lobe: "Limbic", brodmannAreas: "BA 24, 32, 33", functions: ["Error monitoring", "Emotion regulation", "Pain"], description: "Part of the anterior cingulate cortex. Monitors errors and regulates emotion." },
  { name: "Cingulate Gyrus, posterior division", mni: [4, -30, 34], lobe: "Limbic", brodmannAreas: "BA 23, 31", functions: ["Memory retrieval", "Self-reflection", "Default mode"], description: "Part of the default mode network. Involved in memory retrieval and self-reflection." },
  { name: "Precuneous Cortex", mni: [4, -60, 36], lobe: "Parietal", brodmannAreas: "BA 7, 31", functions: ["Self-consciousness", "Episodic memory", "Default mode"], description: "Hub of the default mode network. Involved in self-consciousness and episodic memory." },
  { name: "Cuneal Cortex", mni: [6, -80, 26], lobe: "Occipital", brodmannAreas: "BA 17, 18", functions: ["Visual processing"], description: "Part of the visual cortex. Processes basic visual information from the lower visual field." },
  { name: "Frontal Orbital Cortex", mni: [30, 24, -18], lobe: "Frontal", brodmannAreas: "BA 11, 47", functions: ["Reward processing", "Decision making"], description: "Orbitofrontal cortex. Involved in reward processing and decision making." },
  { name: "Parahippocampal Gyrus, anterior division", mni: [22, -8, -30], lobe: "Temporal", brodmannAreas: "BA 28, 34", functions: ["Memory encoding", "Spatial navigation"], description: "Involved in memory encoding and spatial navigation." },
  { name: "Parahippocampal Gyrus, posterior division", mni: [22, -30, -18], lobe: "Temporal", brodmannAreas: "BA 36, 37", functions: ["Scene recognition", "Place area"], description: "Processes scene recognition and spatial context (parahippocampal place area)." },
  { name: "Lingual Gyrus", mni: [8, -68, -4], lobe: "Occipital", brodmannAreas: "BA 18, 19", functions: ["Visual processing", "Letter recognition", "Reading"], description: "Processes visual information, especially related to letters and reading." },
  { name: "Heschl's Gyrus", mni: [44, -20, 6], lobe: "Temporal", brodmannAreas: "BA 41, 42", functions: ["Primary auditory processing"], description: "Primary auditory cortex. First cortical region to process sound." },
  { name: "Planum Temporale", mni: [52, -26, 10], lobe: "Temporal", brodmannAreas: "BA 22, 42", functions: ["Auditory association", "Language lateralization"], description: "Auditory association area. Typically left-lateralized for language." },
  { name: "Occipital Pole", mni: [10, -96, 6], lobe: "Occipital", brodmannAreas: "BA 17", functions: ["Foveal vision", "Primary visual cortex"], description: "Posterior tip of the occipital lobe. Contains the foveal representation of V1." },
  { name: "Subcallosal Cortex", mni: [2, 22, -14], lobe: "Limbic", brodmannAreas: "BA 25", functions: ["Mood regulation", "Emotional responses"], description: "Part of the limbic system. Regulates mood and emotional responses." },
  { name: "Temporal Fusiform Cortex, posterior division", mni: [36, -34, -22], lobe: "Temporal", brodmannAreas: "BA 37", functions: ["Face processing", "Visual word form"], description: "Involved in face and visual word form processing." },
  { name: "Occipital Fusiform Gyrus", mni: [26, -72, -12], lobe: "Occipital", brodmannAreas: "BA 18, 19", functions: ["Color", "Face", "Word recognition"], description: "Processes color, face, and word recognition." },
]

export const LOBE_COLORS: Record<string, string> = {
  Frontal: '#3b82f6',
  Temporal: '#f59e0b',
  Parietal: '#10b981',
  Occipital: '#8b5cf6',
  Limbic: '#f472b6',
  Insular: '#ef4444',
}

export function getRegionByName(name: string): BrainRegion | undefined {
  return BRAIN_REGIONS.find(r => r.name === name || r.name.toLowerCase() === name.toLowerCase())
}
