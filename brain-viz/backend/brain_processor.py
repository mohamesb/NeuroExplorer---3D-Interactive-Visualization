"""
brain_processor.py — fMRI activation extraction and region mapping.

Uses nilearn to:
  1. Load brain atlases (Harvard-Oxford, AAL, Desikan-Killiany)
  2. Generate activation maps via NeuroQuery for any cognitive term
  3. Extract per-region mean activation values
  4. Return JSON-ready activation dictionaries
"""

import os
import json
import logging
import numpy as np
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
ATLAS_DIR = DATA_DIR / "atlases"
ACTIVATION_DIR = DATA_DIR / "activations"
CACHE_DIR = DATA_DIR / "cache"

for d in [DATA_DIR, ATLAS_DIR, ACTIVATION_DIR, CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Atlas helpers
# ---------------------------------------------------------------------------

_atlas_cache: dict = {}


def get_atlas(name: str = "harvard-oxford"):
    """Return atlas maps + label list.  Cached after first fetch."""
    if name in _atlas_cache:
        return _atlas_cache[name]

    if name == "harvard-oxford":
        from nilearn.datasets import fetch_atlas_harvard_oxford
        atlas = fetch_atlas_harvard_oxford(
            "cort-maxprob-thr25-2mm", data_dir=str(ATLAS_DIR)
        )
        labels = atlas.labels[1:]  # drop "Background"
        result = {"maps": atlas.maps, "labels": labels, "name": name}

    elif name == "aal":
        from nilearn.datasets import fetch_atlas_aal
        atlas = fetch_atlas_aal(data_dir=str(ATLAS_DIR))
        result = {"maps": atlas.maps, "labels": atlas.labels, "name": name}

    else:
        raise ValueError(f"Unknown atlas: {name}")

    _atlas_cache[name] = result
    return result


def list_regions(atlas_name: str = "harvard-oxford") -> list[str]:
    """Return the ordered list of region names for the given atlas."""
    atlas = get_atlas(atlas_name)
    return list(atlas["labels"])


# ---------------------------------------------------------------------------
# NeuroQuery activation map generation
# ---------------------------------------------------------------------------

_encoder = None


def _get_neuroquery_encoder():
    """Lazy-load the NeuroQuery encoder (downloads ~200 MB on first use)."""
    global _encoder
    if _encoder is None:
        from neuroquery import fetch_neuroquery_model, NeuroQueryModel
        model_dir = str(ATLAS_DIR / "neuroquery_model")
        if not os.path.exists(os.path.join(model_dir, "corpus_metadata.csv")):
            logger.info("Downloading NeuroQuery model (~200 MB) ...")
            fetch_neuroquery_model(data_dir=model_dir)
        _encoder = NeuroQueryModel.from_data_dir(model_dir)
    return _encoder


def generate_activation_map(query: str):
    """Generate a whole-brain activation NIfTI for a cognitive term/query.

    Returns a Nifti1Image in MNI152 2mm space.
    """
    encoder = _get_neuroquery_encoder()
    result = encoder(query)
    return result["brain_map"]


# ---------------------------------------------------------------------------
# Region-level activation extraction
# ---------------------------------------------------------------------------


def extract_region_activations(
    query: str,
    atlas_name: str = "harvard-oxford",
    use_cache: bool = True,
) -> dict:
    """For a cognitive query, return {region_name: mean_activation_zscore}.

    Pipeline:
      1. NeuroQuery generates whole-brain activation map
      2. NiftiLabelsMasker averages voxel values per atlas region
      3. Values are min-max normalized to [0, 1] for heatmap display
    """
    cache_key = f"{atlas_name}__{query.lower().replace(' ', '_')}"
    cache_file = CACHE_DIR / f"{cache_key}.json"

    if use_cache and cache_file.exists():
        with open(cache_file) as f:
            return json.load(f)

    from nilearn.maskers import NiftiLabelsMasker

    atlas = get_atlas(atlas_name)
    activation_img = generate_activation_map(query)

    masker = NiftiLabelsMasker(
        labels_img=atlas["maps"],
        standardize=False,
        resampling_target="data",
    )
    values = masker.fit_transform(activation_img)  # shape (1, n_regions)
    values = values.flatten()

    # Normalize to [0, 1]
    vmin, vmax = values.min(), values.max()
    if vmax - vmin > 1e-8:
        normalized = ((values - vmin) / (vmax - vmin)).tolist()
    else:
        normalized = [0.0] * len(values)

    region_data = {}
    for label, raw_val, norm_val in zip(atlas["labels"], values.tolist(), normalized):
        region_data[label] = {
            "raw": round(raw_val, 4),
            "normalized": round(norm_val, 4),
        }

    # Cache result
    with open(cache_file, "w") as f:
        json.dump(region_data, f, indent=2)

    return region_data


# ---------------------------------------------------------------------------
# Precomputed term bank — popular cognitive terms for the UI dropdown
# ---------------------------------------------------------------------------

COGNITIVE_TERMS = [
    "motor",
    "visual",
    "auditory",
    "language",
    "memory",
    "emotion",
    "attention",
    "pain",
    "reward",
    "fear",
    "decision making",
    "working memory",
    "face recognition",
    "reading",
    "music",
    "speech",
    "navigation",
    "social cognition",
    "executive control",
    "default mode",
]


def precompute_common_terms(atlas_name: str = "harvard-oxford"):
    """Pre-cache activations for common cognitive terms."""
    for term in COGNITIVE_TERMS:
        logger.info(f"Pre-computing: {term}")
        try:
            extract_region_activations(term, atlas_name, use_cache=True)
        except Exception as e:
            logger.warning(f"Failed for '{term}': {e}")
