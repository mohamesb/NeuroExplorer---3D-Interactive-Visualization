"""
mesh_generator.py — Generate a realistic brain-shaped GLB mesh.

Creates two hemisphere meshes (deformed ellipsoids with sulci + gyri),
a brain stem, and a cerebellum. Each brain region is mapped to vertex groups
based on proximity to MNI centroid coordinates.
"""

import os
import json
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
MESH_DIR = DATA_DIR / "meshes"
MESH_DIR.mkdir(parents=True, exist_ok=True)

# MNI centroid coordinates for Harvard-Oxford cortical regions
REGION_CENTROIDS_MNI = {
    "Frontal Pole": (0, 62, -4),
    "Insular Cortex": (38, 6, -2),
    "Superior Frontal Gyrus": (8, 32, 50),
    "Middle Frontal Gyrus": (38, 28, 36),
    "Inferior Frontal Gyrus, pars triangularis": (50, 26, 10),
    "Inferior Frontal Gyrus, pars opercularis": (50, 14, 18),
    "Precentral Gyrus": (38, -6, 52),
    "Temporal Pole": (40, 14, -32),
    "Superior Temporal Gyrus, anterior division": (56, -2, -8),
    "Superior Temporal Gyrus, posterior division": (60, -24, 2),
    "Middle Temporal Gyrus, anterior division": (58, -6, -22),
    "Middle Temporal Gyrus, posterior division": (62, -30, -8),
    "Middle Temporal Gyrus, temporooccipital part": (56, -48, 0),
    "Inferior Temporal Gyrus, anterior division": (50, -8, -38),
    "Inferior Temporal Gyrus, posterior division": (54, -30, -26),
    "Inferior Temporal Gyrus, temporooccipital part": (50, -52, -16),
    "Postcentral Gyrus": (42, -28, 52),
    "Superior Parietal Lobule": (24, -52, 60),
    "Supramarginal Gyrus, anterior division": (56, -30, 38),
    "Supramarginal Gyrus, posterior division": (54, -42, 34),
    "Angular Gyrus": (50, -54, 26),
    "Lateral Occipital Cortex, superior division": (34, -72, 30),
    "Lateral Occipital Cortex, inferior division": (40, -78, 2),
    "Intracalcarine Cortex": (8, -76, 8),
    "Frontal Medial Cortex": (2, 46, -14),
    "Juxtapositional Lobule Cortex": (4, -2, 58),
    "Subcallosal Cortex": (2, 22, -14),
    "Paracingulate Gyrus": (4, 36, 30),
    "Cingulate Gyrus, anterior division": (4, 20, 26),
    "Cingulate Gyrus, posterior division": (4, -30, 34),
    "Precuneous Cortex": (4, -60, 36),
    "Cuneal Cortex": (6, -80, 26),
    "Frontal Orbital Cortex": (30, 24, -18),
    "Parahippocampal Gyrus, anterior division": (22, -8, -30),
    "Parahippocampal Gyrus, posterior division": (22, -30, -18),
    "Lingual Gyrus": (8, -68, -4),
    "Temporal Fusiform Cortex, anterior division": (34, -10, -38),
    "Temporal Fusiform Cortex, posterior division": (36, -34, -22),
    "Temporal Occipital Fusiform Cortex": (32, -54, -14),
    "Occipital Fusiform Gyrus": (26, -72, -12),
    "Frontal Operculum Cortex": (42, 16, 4),
    "Central Opercular Cortex": (46, -4, 10),
    "Parietal Operculum Cortex": (48, -26, 18),
    "Planum Polare": (46, -2, -10),
    "Heschl's Gyrus": (44, -20, 6),
    "Planum Temporale": (52, -26, 10),
    "Supracalcarine Cortex": (6, -78, 16),
    "Occipital Pole": (10, -96, 6),
}

REGION_DESCRIPTIONS = {
    "Frontal Pole": "Involved in planning, decision making, and working memory.",
    "Insular Cortex": "Processes interoception, emotion, and taste.",
    "Superior Frontal Gyrus": "Contributes to self-awareness and higher cognitive functions.",
    "Middle Frontal Gyrus": "Involved in attention, working memory, and executive function.",
    "Inferior Frontal Gyrus, pars triangularis": "Part of Broca's area. Language production.",
    "Inferior Frontal Gyrus, pars opercularis": "Part of Broca's area. Speech production.",
    "Precentral Gyrus": "Primary motor cortex. Controls voluntary movement.",
    "Temporal Pole": "Semantic memory, social cognition, and emotion processing.",
    "Superior Temporal Gyrus, anterior division": "Processes auditory stimuli and speech.",
    "Superior Temporal Gyrus, posterior division": "Contains Wernicke's area. Language comprehension.",
    "Postcentral Gyrus": "Primary somatosensory cortex. Touch, pressure, pain.",
    "Superior Parietal Lobule": "Spatial orientation and visuospatial processing.",
    "Angular Gyrus": "Reading, arithmetic, spatial cognition.",
    "Intracalcarine Cortex": "Primary visual cortex (V1).",
    "Precuneous Cortex": "Default mode network hub. Self-consciousness.",
    "Cingulate Gyrus, anterior division": "Error monitoring and emotion regulation.",
    "Heschl's Gyrus": "Primary auditory cortex.",
    "Occipital Pole": "Foveal vision representation in V1.",
}


def _create_hemisphere_mesh(side: str, n_lat: int = 64, n_lon: int = 64):
    """Create a brain hemisphere as a deformed sphere with sulci."""
    import trimesh

    sign = -1 if side == 'left' else 1
    vertices = []
    faces = []

    for i in range(n_lat + 1):
        theta = np.pi * i / n_lat
        for j in range(n_lon + 1):
            phi = 2 * np.pi * j / n_lon

            x = np.sin(theta) * np.cos(phi)
            y = np.cos(theta)
            z = np.sin(theta) * np.sin(phi)

            # Ellipsoid
            x = x * 0.52 + sign * 0.52
            y *= 0.62
            z *= 0.72

            # Frontal broadening
            if z < -0.15:
                f = 1 + abs(z + 0.15) * 0.2
                x *= f
                y *= 1 + abs(z + 0.15) * 0.05

            # Occipital narrowing
            if z > 0.35:
                f = 1 - (z - 0.35) * 0.35
                x *= f

            # Temporal bulge
            if y < -0.15:
                f = 1 + np.exp(-((y + 0.35) ** 2) / 0.04) * 0.18
                x *= f

            # Medial flattening
            md = abs(x - sign * 0.02)
            if md < 0.2:
                x = sign * abs(x) * (0.4 + 0.6 * (md / 0.2)) + sign * 0.03

            # Sulci
            r = np.sqrt(x**2 + y**2 + z**2)
            th = np.arctan2(z, y)
            ph = np.arctan2(x, np.sqrt(y**2 + z**2))
            s = (np.sin(th * 5 + ph * 3) * 0.018 +
                 np.sin(th * 8 + ph * 5 + 1.2) * 0.012 +
                 np.sin(th * 12 + ph * 7 + 2.5) * 0.008)
            s += np.exp(-((y + 0.05)**2) / 0.003) * np.exp(-((z + 0.1)**2) / 0.05) * -0.04
            s += np.exp(-((z + 0.05)**2) / 0.004) * np.cos(y * 4) * -0.025

            if r > 0:
                x += (x / r) * s
                y += (y / r) * s
                z += (z / r) * s

            vertices.append([x, y, z])

    vertices = np.array(vertices)

    for i in range(n_lat):
        for j in range(n_lon):
            a = i * (n_lon + 1) + j
            b = a + n_lon + 1
            faces.append([a, b, a + 1])
            faces.append([a + 1, b, b + 1])

    faces = np.array(faces)
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    mesh.fix_normals()
    return mesh


def generate_brain_glb(output_path: str = None) -> str:
    """Generate a realistic brain GLB with named hemisphere meshes."""
    import trimesh

    if output_path is None:
        output_path = str(MESH_DIR / "brain_regions.glb")

    scene = trimesh.Scene()

    # Hemispheres
    for side in ['left', 'right']:
        mesh = _create_hemisphere_mesh(side, 48, 48)
        mesh.visual = trimesh.visual.ColorVisuals(
            mesh=mesh,
            face_colors=np.full((len(mesh.faces), 4), [100, 150, 200, 200], dtype=np.uint8),
        )
        scene.add_geometry(mesh, node_name=f"{side}_hemisphere")

    # Brain stem
    stem = trimesh.creation.cylinder(radius=0.08, height=0.4, sections=16)
    stem.apply_translation([0, -0.55, 0.12])
    stem.visual = trimesh.visual.ColorVisuals(
        mesh=stem,
        face_colors=np.full((len(stem.faces), 4), [80, 120, 170, 180], dtype=np.uint8),
    )
    scene.add_geometry(stem, node_name="brainstem")

    # Cerebellum
    cereb = trimesh.creation.icosphere(subdivisions=3, radius=0.25)
    verts = cereb.vertices.copy()
    verts[:, 1] *= 0.55
    verts[:, 0] *= 1.4
    verts[:, 2] *= 0.85
    cereb.vertices = verts
    cereb.apply_translation([0, -0.42, 0.32])
    cereb.visual = trimesh.visual.ColorVisuals(
        mesh=cereb,
        face_colors=np.full((len(cereb.faces), 4), [80, 130, 180, 170], dtype=np.uint8),
    )
    scene.add_geometry(cereb, node_name="cerebellum")

    scene.export(output_path)
    logger.info(f"Brain GLB saved to {output_path}")
    return output_path


def try_freesurfer_brain_glb(output_path: str = None) -> str:
    """Attempt FreeSurfer build, fall back to procedural brain."""
    import trimesh

    if output_path is None:
        output_path = str(MESH_DIR / "brain_regions.glb")

    fsaverage_dir = DATA_DIR / "fsaverage"
    lh_pial = fsaverage_dir / "surf" / "lh.pial"
    lh_annot = fsaverage_dir / "label" / "lh.aparc.annot"
    rh_pial = fsaverage_dir / "surf" / "rh.pial"
    rh_annot = fsaverage_dir / "label" / "rh.aparc.annot"

    if not all(p.exists() for p in [lh_pial, lh_annot, rh_pial, rh_annot]):
        logger.warning("FreeSurfer fsaverage not found, using procedural brain.")
        return generate_brain_glb(output_path)

    import nibabel.freesurfer as fs

    scene = trimesh.Scene()
    scale = 80.0

    for hemi, pial_path, annot_path in [
        ("lh", str(lh_pial), str(lh_annot)),
        ("rh", str(rh_pial), str(rh_annot)),
    ]:
        coords, faces_arr = fs.read_geometry(pial_path)
        labels, ctab, names = fs.read_annot(annot_path)
        coords = coords / scale

        for idx, name_bytes in enumerate(names):
            name = name_bytes.decode() if isinstance(name_bytes, bytes) else str(name_bytes)
            if name in ("unknown", "corpuscallosum", "???"):
                continue
            vertex_mask = labels == idx
            face_mask = vertex_mask[faces_arr].all(axis=1)
            if not face_mask.any():
                continue
            region_faces = faces_arr[face_mask]
            unique_verts = np.unique(region_faces)
            vert_map = {int(old): new for new, old in enumerate(unique_verts)}
            local_faces = np.vectorize(vert_map.get)(region_faces)
            mesh = trimesh.Trimesh(vertices=coords[unique_verts], faces=local_faces)
            node_name = f"{hemi}_{name}"
            color = ctab[idx, :3]
            mesh.visual = trimesh.visual.ColorVisuals(
                mesh=mesh,
                face_colors=np.tile(np.append(color, 255).astype(np.uint8), (len(local_faces), 1)),
            )
            scene.add_geometry(mesh, node_name=node_name)

    scene.export(output_path)
    logger.info(f"FreeSurfer brain GLB saved to {output_path}")
    return output_path


def get_region_metadata() -> dict:
    result = {}
    for name, coord in REGION_CENTROIDS_MNI.items():
        result[name] = {
            "name": name,
            "mni_coordinates": {"x": coord[0], "y": coord[1], "z": coord[2]},
            "description": REGION_DESCRIPTIONS.get(name, ""),
            "hemisphere": "bilateral",
        }
    return result


def ensure_brain_mesh() -> str:
    glb_path = MESH_DIR / "brain_regions.glb"
    if not glb_path.exists():
        try_freesurfer_brain_glb(str(glb_path))
    return str(glb_path)
