"""
main.py — FastAPI backend for NeuroViz 3D Brain Visualization.

Endpoints:
  GET  /api/regions              — List all brain regions with metadata
  GET  /api/regions/{name}       — Get single region details
  GET  /api/activation/{query}   — Get per-region fMRI activation for a cognitive term
  GET  /api/terms                — List available cognitive search terms
  GET  /api/mesh/brain.glb       — Download the brain GLB mesh file
  GET  /api/health               — Health check
"""

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — generate mesh + preload atlas on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure brain mesh exists and atlas is loaded."""
    from mesh_generator import ensure_brain_mesh
    from brain_processor import get_atlas

    logger.info("Ensuring brain mesh exists...")
    ensure_brain_mesh()

    logger.info("Pre-loading Harvard-Oxford atlas...")
    try:
        get_atlas("harvard-oxford")
    except Exception as e:
        logger.warning(f"Could not preload atlas (will retry on first request): {e}")

    yield  # app runs
    logger.info("Shutting down.")


app = FastAPI(
    title="NeuroViz API",
    version="1.0.0",
    description="Backend for 3D Brain Visualization with fMRI data",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "neuroviz-api"}


@app.get("/api/terms")
async def get_terms():
    """Return the list of cognitive terms available for activation queries."""
    from brain_processor import COGNITIVE_TERMS
    return {"terms": COGNITIVE_TERMS}


@app.get("/api/regions")
async def list_regions(atlas: str = Query("harvard-oxford")):
    """List all regions with full metadata."""
    from mesh_generator import get_region_metadata
    from brain_processor import list_regions as get_atlas_labels

    metadata = get_region_metadata()

    try:
        atlas_labels = get_atlas_labels(atlas)
    except Exception:
        atlas_labels = list(metadata.keys())

    # Merge: prefer metadata but include atlas labels that may not have metadata
    result = []
    seen = set()
    for label in atlas_labels:
        entry = metadata.get(label, {"name": label, "description": ""})
        entry["name"] = label
        result.append(entry)
        seen.add(label)

    for label, entry in metadata.items():
        if label not in seen:
            result.append(entry)

    return {"atlas": atlas, "count": len(result), "regions": result}


@app.get("/api/regions/{region_name}")
async def get_region(region_name: str):
    """Get detailed info for a single brain region."""
    from mesh_generator import get_region_metadata
    metadata = get_region_metadata()

    # Fuzzy match: try exact, then case-insensitive
    if region_name in metadata:
        return metadata[region_name]

    for key, val in metadata.items():
        if key.lower() == region_name.lower():
            return val

    raise HTTPException(status_code=404, detail=f"Region '{region_name}' not found")


@app.get("/api/activation/{query}")
async def get_activation(
    query: str,
    atlas: str = Query("harvard-oxford"),
):
    """Compute per-region activation values for a cognitive search term.

    Uses NeuroQuery to generate an activation map, then nilearn to extract
    mean values per atlas region.  Results are cached on disk.
    """
    from brain_processor import extract_region_activations

    try:
        data = extract_region_activations(query, atlas_name=atlas)
    except Exception as e:
        logger.error(f"Activation extraction failed for '{query}': {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "query": query,
        "atlas": atlas,
        "region_count": len(data),
        "activations": data,
    }


@app.get("/api/mesh/brain.glb")
async def get_brain_mesh():
    """Serve the brain GLB mesh file."""
    from mesh_generator import ensure_brain_mesh
    path = ensure_brain_mesh()

    if not os.path.exists(path):
        raise HTTPException(status_code=500, detail="Brain mesh not generated")

    return FileResponse(
        path,
        media_type="model/gltf-binary",
        filename="brain_regions.glb",
    )


@app.get("/api/mesh/brain.json")
async def get_brain_mesh_json():
    """Serve real FreeSurfer fsaverage5 pial surface mesh as JSON."""
    mesh_path = Path(__file__).parent / "data" / "meshes" / "brain_mesh.json"

    if not mesh_path.exists():
        # Auto-generate if missing
        try:
            logger.info("Generating brain mesh JSON from fsaverage5...")
            from nilearn.datasets import fetch_surf_fsaverage
            from nilearn.surface import load_surf_mesh
            import numpy as np
            import json

            fs = fetch_surf_fsaverage(mesh="fsaverage5")
            meshes = {}
            for hemi, key in [("lh", "pial_left"), ("rh", "pial_right")]:
                coords, faces = load_surf_mesh(fs[key])
                meshes[hemi] = {
                    "vertices": np.round(coords, 3).tolist(),
                    "faces": faces.tolist(),
                }
            mesh_path.parent.mkdir(parents=True, exist_ok=True)
            with open(mesh_path, "w") as f:
                json.dump(meshes, f)
            logger.info(f"Brain mesh JSON saved to {mesh_path}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not generate mesh: {e}")

    return FileResponse(
        str(mesh_path),
        media_type="application/json",
        filename="brain_mesh.json",
    )


# ---------------------------------------------------------------------------
# Static fallback activation data (no NeuroQuery required)
# ---------------------------------------------------------------------------

@app.get("/api/activation-static/{query}")
async def get_static_activation(query: str):
    """Return simulated activation data when NeuroQuery is not installed.

    Uses deterministic random values seeded by the query string so results
    are consistent for the same term.
    """
    import hashlib
    import numpy as np
    from mesh_generator import REGION_CENTROIDS_MNI

    seed = int(hashlib.md5(query.encode()).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)

    # Keyword-based region weighting for more realistic patterns
    keyword_weights = {
        "motor": ["Precentral Gyrus", "Juxtapositional Lobule Cortex", "Postcentral Gyrus"],
        "visual": ["Occipital Pole", "Intracalcarine Cortex", "Cuneal Cortex", "Lingual Gyrus"],
        "auditory": ["Heschl's Gyrus", "Planum Temporale", "Superior Temporal Gyrus, posterior division"],
        "language": ["Inferior Frontal Gyrus, pars triangularis", "Inferior Frontal Gyrus, pars opercularis",
                      "Superior Temporal Gyrus, posterior division", "Angular Gyrus"],
        "memory": ["Parahippocampal Gyrus, anterior division", "Precuneous Cortex",
                    "Cingulate Gyrus, posterior division", "Angular Gyrus"],
        "emotion": ["Insular Cortex", "Subcallosal Cortex", "Cingulate Gyrus, anterior division",
                     "Frontal Orbital Cortex", "Temporal Pole"],
        "attention": ["Superior Parietal Lobule", "Middle Frontal Gyrus", "Frontal Pole",
                       "Supramarginal Gyrus, anterior division"],
        "pain": ["Insular Cortex", "Cingulate Gyrus, anterior division", "Postcentral Gyrus"],
        "reward": ["Frontal Orbital Cortex", "Subcallosal Cortex", "Frontal Medial Cortex"],
        "fear": ["Insular Cortex", "Temporal Pole", "Cingulate Gyrus, anterior division"],
        "decision making": ["Frontal Pole", "Frontal Orbital Cortex", "Middle Frontal Gyrus",
                             "Cingulate Gyrus, anterior division"],
        "face recognition": ["Temporal Fusiform Cortex, posterior division",
                              "Occipital Fusiform Gyrus", "Inferior Temporal Gyrus, posterior division"],
        "reading": ["Temporal Occipital Fusiform Cortex", "Angular Gyrus",
                     "Inferior Frontal Gyrus, pars triangularis"],
        "music": ["Heschl's Gyrus", "Planum Temporale", "Superior Temporal Gyrus, anterior division",
                   "Inferior Frontal Gyrus, pars opercularis"],
        "speech": ["Inferior Frontal Gyrus, pars opercularis", "Precentral Gyrus",
                    "Superior Temporal Gyrus, posterior division", "Insular Cortex"],
        "navigation": ["Parahippocampal Gyrus, posterior division", "Precuneous Cortex",
                        "Superior Parietal Lobule"],
    }

    # Find best matching keyword
    boosted = set()
    query_lower = query.lower()
    for kw, regions in keyword_weights.items():
        if kw in query_lower:
            boosted.update(regions)

    activations = {}
    for name in REGION_CENTROIDS_MNI:
        base = rng.random() * 0.4
        if name in boosted:
            base = 0.6 + rng.random() * 0.4  # boost to 0.6–1.0
        activations[name] = {
            "raw": round(base * 6 - 1, 4),
            "normalized": round(base, 4),
        }

    return {
        "query": query,
        "atlas": "harvard-oxford",
        "region_count": len(activations),
        "activations": activations,
        "source": "simulated",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
