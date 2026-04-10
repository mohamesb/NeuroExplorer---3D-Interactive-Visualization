#!/usr/bin/env python3
"""
download_data.py — Download brain atlas data, NeuroQuery model, and optionally FreeSurfer fsaverage.

Usage:
    python scripts/download_data.py [--full]

Without --full: downloads Harvard-Oxford atlas and NeuroQuery model (~250 MB)
With --full:    also downloads FreeSurfer fsaverage surfaces (~50 MB)
"""

import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent / "backend"
DATA_DIR = BACKEND_DIR / "data"
ATLAS_DIR = DATA_DIR / "atlases"
CACHE_DIR = DATA_DIR / "cache"
MESH_DIR = DATA_DIR / "meshes"

for d in [DATA_DIR, ATLAS_DIR, CACHE_DIR, MESH_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def download_harvard_oxford():
    """Download Harvard-Oxford cortical atlas via nilearn."""
    logger.info("Downloading Harvard-Oxford cortical atlas...")
    from nilearn.datasets import fetch_atlas_harvard_oxford
    atlas = fetch_atlas_harvard_oxford("cort-maxprob-thr25-2mm", data_dir=str(ATLAS_DIR))
    logger.info(f"  Atlas saved. Labels: {len(atlas.labels)}")
    return atlas


def download_neuroquery_model():
    """Download the NeuroQuery encoding model (~200 MB)."""
    model_dir = str(ATLAS_DIR / "neuroquery_model")
    marker = os.path.join(model_dir, "corpus_metadata.csv")
    if os.path.exists(marker):
        logger.info("NeuroQuery model already downloaded.")
        return

    logger.info("Downloading NeuroQuery model (~200 MB)...")
    from neuroquery import fetch_neuroquery_model
    fetch_neuroquery_model(data_dir=model_dir)
    logger.info("  NeuroQuery model downloaded.")


def download_fsaverage():
    """Download FreeSurfer fsaverage surfaces via nilearn."""
    logger.info("Downloading FreeSurfer fsaverage dataset...")
    from nilearn.datasets import fetch_surf_fsaverage
    fsaverage = fetch_surf_fsaverage(mesh="fsaverage", data_dir=str(DATA_DIR))

    # Also try to get the full fsaverage with annotations
    try:
        import nibabel.freesurfer as fs
        # nilearn provides the pial surfaces; we'll use those
        target_dir = DATA_DIR / "fsaverage" / "surf"
        target_dir.mkdir(parents=True, exist_ok=True)

        label_dir = DATA_DIR / "fsaverage" / "label"
        label_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"  fsaverage surfaces at: {fsaverage}")
    except Exception as e:
        logger.warning(f"  Note: full fsaverage annotations not available: {e}")

    logger.info("  fsaverage downloaded.")


def precompute_activations():
    """Pre-compute activation data for common cognitive terms."""
    logger.info("Pre-computing activation data for common terms...")
    sys.path.insert(0, str(BACKEND_DIR))
    from brain_processor import precompute_common_terms
    precompute_common_terms()
    logger.info("  Pre-computation complete.")


def main():
    full = "--full" in sys.argv

    logger.info("=" * 60)
    logger.info("NeuroViz Data Downloader")
    logger.info("=" * 60)

    # Step 1: Harvard-Oxford atlas
    try:
        download_harvard_oxford()
    except Exception as e:
        logger.error(f"Failed to download Harvard-Oxford atlas: {e}")
        logger.info("The app will still work with simulated data.")

    # Step 2: NeuroQuery model
    try:
        download_neuroquery_model()
    except Exception as e:
        logger.error(f"Failed to download NeuroQuery model: {e}")
        logger.info("The app will fall back to simulated activation data.")

    # Step 3 (optional): FreeSurfer fsaverage
    if full:
        try:
            download_fsaverage()
        except Exception as e:
            logger.warning(f"FreeSurfer download failed (optional): {e}")

    # Step 4: Pre-compute activations
    try:
        precompute_activations()
    except Exception as e:
        logger.warning(f"Pre-computation skipped: {e}")
        logger.info("Activations will be computed on first request.")

    logger.info("=" * 60)
    logger.info("Data download complete!")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
