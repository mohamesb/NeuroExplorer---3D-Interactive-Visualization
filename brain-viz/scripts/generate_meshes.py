#!/usr/bin/env python3
"""
generate_meshes.py — Generate GLB brain meshes for the frontend.

Usage:
    python scripts/generate_meshes.py

Attempts FreeSurfer-based mesh first, falls back to procedural generation.
"""

import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from mesh_generator import try_freesurfer_brain_glb, MESH_DIR


def main():
    MESH_DIR.mkdir(parents=True, exist_ok=True)
    output = str(MESH_DIR / "brain_regions.glb")

    logger.info("Generating brain GLB mesh...")
    result = try_freesurfer_brain_glb(output)
    logger.info(f"Brain mesh saved to: {result}")

    import os
    size_mb = os.path.getsize(result) / (1024 * 1024)
    logger.info(f"File size: {size_mb:.2f} MB")


if __name__ == "__main__":
    main()
