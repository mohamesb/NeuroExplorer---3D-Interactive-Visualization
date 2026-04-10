# NeuroViz — Interactive 3D Brain Visualization

A production-ready web application for exploring the human brain in 3D with real fMRI activation data. Built with a **Python (FastAPI)** backend for neuroimaging data processing and a **React + Three.js (React Three Fiber)** frontend for interactive 3D rendering.

## Architecture

```
brain-viz/
├── backend/                  # Python FastAPI server
│   ├── main.py               # API entry point
│   ├── brain_processor.py    # fMRI data processing with nilearn
│   ├── mesh_generator.py     # GLB brain mesh generation with trimesh
│   ├── requirements.txt      # Python dependencies
│   └── data/                 # Downloaded brain data (auto-generated)
│       ├── atlases/          # Brain atlas files (Harvard-Oxford, AAL)
│       ├── activations/      # Neurosynth/NeuroQuery activation maps
│       └── meshes/           # Generated GLB brain meshes
├── frontend/                 # React + Three.js application
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx           # Root app with routing
│       ├── main.tsx          # Entry point
│       ├── components/
│       │   ├── BrainScene.tsx        # Main 3D brain canvas
│       │   ├── BrainModel.tsx        # Brain mesh loader + raycasting
│       │   ├── RegionHighlight.tsx   # Hover/click region effects
│       │   ├── HUD.tsx               # Heads-up display overlay
│       │   ├── Sidebar.tsx           # Region info sidebar
│       │   ├── ActivityHeatmap.tsx   # fMRI heatmap color mapping
│       │   └── LoadingScreen.tsx     # Loading state
│       ├── pages/
│       │   ├── HomePage.tsx          # Main brain explorer
│       │   └── RegionPage.tsx        # Detailed region view
│       ├── data/
│       │   └── brainRegions.ts       # Static region metadata
│       ├── utils/
│       │   └── api.ts                # Backend API client
│       └── styles/
│           └── globals.css           # Global styles
├── scripts/
│   ├── setup.sh              # Full setup script (both backend + frontend)
│   ├── download_data.py      # Downloads brain data from open sources
│   └── generate_meshes.py    # Generates GLB meshes from atlas data
└── docs/
    └── SETUP.md              # Detailed setup instructions
```

## Quick Start

```bash
# 1. Run the full setup (installs Python deps, Node deps, downloads data)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 2. Start the backend
cd backend && uvicorn main:app --reload --port 8000

# 3. Start the frontend (in a new terminal)
cd frontend && npm run dev
```

Open http://localhost:5173

## How fMRI Data Maps to the 3D Model

1. **Atlas Parcellation**: The brain is divided into ~48 cortical regions using the
   Harvard-Oxford atlas (MNI152 space, 2mm resolution).
2. **Activation Extraction**: For each cognitive term (e.g., "motor", "visual"),
   NeuroQuery generates a whole-brain activation map (NIfTI).
3. **Region Averaging**: nilearn's `NiftiLabelsMasker` computes the mean z-score
   per atlas region, producing a JSON: `{ "Precentral Gyrus": 4.1, ... }`.
4. **Mesh Generation**: FreeSurfer `fsaverage` surfaces are split by atlas label
   into per-region sub-meshes, exported as a single multi-node GLB.
5. **Frontend Mapping**: React Three Fiber loads the GLB, matches mesh node names
   to activation JSON keys, and applies a blue→red heatmap color scale.
