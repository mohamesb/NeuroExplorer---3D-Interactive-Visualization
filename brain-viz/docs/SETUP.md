# NeuroViz — Detailed Setup Guide

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| pip | 23+ | `pip --version` |

## Quick Start (Automated)

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This installs all dependencies, downloads brain data, and generates meshes.

## Manual Setup

### 1. Python Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Key Python packages:**

| Package | Purpose |
|---------|---------|
| `fastapi` + `uvicorn` | REST API server |
| `nilearn` | Neuroimaging ML toolkit — atlas fetching, masking, region extraction |
| `nibabel` | Read NIfTI/FreeSurfer files |
| `neuroquery` | Generate activation maps from text queries |
| `trimesh` | 3D mesh processing and GLB export |
| `numpy` / `scipy` | Array math and signal processing |

### 2. Download Brain Data

```bash
# Basic (atlas + NeuroQuery model, ~250 MB)
python scripts/download_data.py

# Full (includes FreeSurfer fsaverage surfaces, ~300 MB)
python scripts/download_data.py --full
```

**What gets downloaded:**

- **Harvard-Oxford Atlas** (~5 MB): 48-region cortical parcellation in MNI152 space.
  Source: FSL, via nilearn. Provides the region labels and volumetric label image
  used to extract per-region activation values from whole-brain NIfTI maps.

- **NeuroQuery Model** (~200 MB): Pre-trained encoding model from ~13,000 fMRI studies.
  Given any text query (e.g., "motor cortex"), it generates a predicted whole-brain
  activation map (NIfTI) in MNI152 space.

- **FreeSurfer fsaverage** (optional, ~50 MB): Template brain surface meshes with
  anatomical parcellation annotations. Used to generate high-quality per-region 3D
  meshes. If not available, the app uses procedural icosphere-based regions.

### 3. Generate Brain Mesh

```bash
python scripts/generate_meshes.py
```

This creates `backend/data/meshes/brain_regions.glb` — a multi-node GLB file where
each mesh node is named after its brain region. The frontend loads this and maps
each node name to activation data.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev   # Development server at http://localhost:5173
```

**Key frontend packages:**

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Three.js helpers (controls, loaders, effects) |
| `@react-three/postprocessing` | Bloom, outline, and other post-processing |
| `three` | 3D rendering engine |
| `framer-motion` | Animations and transitions |
| `react-router-dom` | Client-side routing |
| `tailwindcss` | Utility-first CSS |

### 5. Start the App

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## How fMRI Data Maps to the 3D Model

### Pipeline Overview

```
User types "motor" in search bar
         │
         ▼
┌─────────────────────────┐
│  NeuroQuery Encoder     │  Python: neuroquery
│  "motor" → NIfTI image  │  13,000-study meta-analytic model
└────────┬────────────────┘
         │  Whole-brain z-score map (MNI152 2mm)
         ▼
┌─────────────────────────┐
│  NiftiLabelsMasker      │  Python: nilearn
│  Average per atlas ROI  │  Harvard-Oxford 48 cortical regions
└────────┬────────────────┘
         │  JSON: {"Precentral Gyrus": {"raw": 4.1, "normalized": 0.92}, ...}
         ▼
┌─────────────────────────┐
│  FastAPI REST endpoint   │  /api/activation/motor
│  Serves JSON to browser  │  Cached on disk after first computation
└────────┬────────────────┘
         │  HTTP response
         ▼
┌─────────────────────────┐
│  React Three Fiber       │  BrainModel.tsx
│  Maps values → colors    │  HSL heatmap: blue (0) → red (1)
│  Applies to mesh nodes   │  Each mesh.name matches a region key
└─────────────────────────┘
```

### Step-by-Step

1. **Query Encoding** (`brain_processor.py`):
   The NeuroQuery model transforms a text query into a 3D activation likelihood
   map. This is a NIfTI-format volumetric image (~90×108×90 voxels at 2mm
   resolution) aligned to MNI152 standard space.

2. **Region Extraction** (`brain_processor.py`):
   `NiftiLabelsMasker` from nilearn takes the activation image and the
   Harvard-Oxford atlas. For each of the 48 labeled regions, it computes the
   mean voxel value within that region's boundaries. This produces a single
   number per region.

3. **Normalization**:
   Raw values are min-max normalized to [0, 1] across all regions for a given
   query. This makes the heatmap visually meaningful regardless of absolute
   z-score magnitude.

4. **Mesh Mapping** (`BrainModel.tsx`):
   The GLB file contains mesh nodes named after brain regions. The frontend
   iterates over all regions, looks up the activation value from the JSON, and
   converts it to a color using an HSL gradient (blue=low, red=high). The color
   is applied to the mesh's `MeshStandardMaterial`.

5. **Interaction**:
   React Three Fiber's built-in raycasting detects mouse hover/click on
   individual meshes. `e.object.name` identifies the clicked region, triggering
   the sidebar and detail views.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/terms` | List available cognitive search terms |
| GET | `/api/regions` | List all brain regions with metadata |
| GET | `/api/regions/{name}` | Get single region details |
| GET | `/api/activation/{query}` | Compute per-region fMRI activation |
| GET | `/api/activation-static/{query}` | Simulated activation (no NeuroQuery needed) |
| GET | `/api/mesh/brain.glb` | Download brain GLB mesh |

---

## Troubleshooting

**NeuroQuery download fails**: The app falls back to `/api/activation-static/`
which uses deterministic simulated data based on keyword-region associations.

**Mesh not loading**: Run `python scripts/generate_meshes.py` manually. Check
that `backend/data/meshes/brain_regions.glb` exists.

**CORS errors**: Ensure the backend runs on port 8000 and the frontend's
`vite.config.ts` proxy is set to `http://localhost:8000`.

**Python version issues**: nilearn and neuroquery require Python 3.10+.
Check with `python3 --version`.
