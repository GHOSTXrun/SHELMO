# NODQEN character mesh

A standalone glTF 2.0 binary model based on the supplied NODQEN brand illustration.

- 23 named meshes, approximately 51,000 triangles.
- One continuous stepped enclosure and one hollow rounded face frame.
- Smooth bevel normals; smoked screen, chartreuse eye apertures, ivory connector and rounded U-shaped cartridge.
- Includes rear panel and side ventilation details for orbit viewing.
- Physically based materials with clearcoat; eye glow and studio illumination are provided by the viewer.

Download: [nodqen-character.glb](nodqen-character.glb).

Rebuild from the repository root with Node.js:

```sh
node tools/build-character.mjs
```

The builder uses the repository's pinned Three.js dependency. No external generation service is required. The mesh is an interpretation of the reference illustration, rather than an original production CAD file.
