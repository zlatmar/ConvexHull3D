# ConvexHull3D

A randomized incremental 3D convex hull, based on *Computational Geometry: Algorithms and Applications*, with a Three.js visualization. Fifty points move through a box, bounce off its walls, and rebuild the hull on every animation update.

## Run

```sh
git clone --recursive https://github.com/zlatmar/ConvexHull3D.git
cd ConvexHull3D
npm ci
npm run dev
```

Open the local URL printed by Vite. `index.html` is a Vite entry point; opening it directly as a file does not compile the TypeScript modules. Use the **Pause / Resume**, **New points**, and **Speed** controls; drag to orbit, scroll to zoom, or enable **Rotate view**.

```sh
npm test
npm run build
npm run preview
```

Tests use Node's built-in test runner and load the TypeScript geometry in memory. The production build separately runs the strict TypeScript checker. Node 20.10.0 was used for local verification; CI uses Node 22.

## Algorithm and input contract

The geometry engine remains independent of Three.js. `ConvexHull` chooses an affinely independent tetrahedron, orients its faces outward, shuffles the remaining points, and inserts them using a bidirectional point/face conflict graph. The visible faces are replaced by triangles joining the new point to their horizon. Topology lives in a doubly connected edge list (DCEL); live vertices have outgoing incident edges, and deleted faces, edges, vertices, and conflict links are removed.

Visibility and initial-simplex selection use the adaptive orientation predicates from [robust-predicates](https://github.com/mourner/robust-predicates). No trigonometric rotation, decimal rounding, or fixed world-space epsilon is used to decide which side of a plane contains a point. Exactly coplanar points do not see that face. Coplanar facets remain triangulated; their diagonal choice can depend on insertion order.

```ts
const hull = new ConvexHull(points, { random: seededRandom(42) });
const triangles = hull.getFaces(); // flat xyz triples, outward triangle winding
hull.assertValid();               // optional expensive diagnostics
```

- Each point is `{ number, x, y, z }`, with a unique safe-integer identifier and finite coordinates. Coordinates are copied; the caller's objects and order are preserved.
- Duplicate coordinates are deduplicated even when their identifiers differ.
- At least four affinely independent points are required. Empty, collinear, and wholly coplanar sets throw descriptive errors; this API does not return a 2D hull.
- Nonzero coordinate magnitudes must lie between `1e-75` and `1e75` to keep predicate arithmetic within the supported range. Normalize data outside that range before calling the engine.
- The optional `random` callback returns values in `[0, 1)`. `validate: true` checks topology and graph reciprocity after each insertion and containment after construction.

The scene advances positions in units per second. Wall reflections include overshoot and multiple collisions. A long browser stall is capped at 50 ms of simulation time per animation frame. Hull and point GPU buffers are reused, including after resetting the points; hot reload disposes renderer resources and event handlers. Camera Z-up is set before constructing OrbitControls, and resize updates the canvas and projection.

## Animation history

Commit [`30f4b6f`](https://github.com/zlatmar/ConvexHull3D/commit/30f4b6f) ("Make points move in the box") introduced the bouncing points and rebuilt a Three.js `ConvexGeometry` every frame. Commit [`ab632a8`](https://github.com/zlatmar/ConvexHull3D/commit/ab632a8) ("3D Convex hull working solution") replaced that implementation with the custom hull but removed the movement loop. The restored scene uses the custom incremental hull, time-based movement, and persistent GPU buffers.

## Regression coverage

The tests cover the review's axis-aligned, collinear-prefix, duplicate-coordinate, cube, and coplanarity failures; tetrahedron permutations; integer grids; random point clouds compared with Three.js QuickHull; translations, scaling, reflection, and near-planar inputs; invalid input; topology and conflict cleanup; wall overshoot; frame-rate independence; and 1,000 frames of hull reconstruction.

QuickHull is used only as an independent test comparison, not by the application. Tests compare volume and containment instead of requiring the same triangulation for coplanar facets.

## DCEL submodule

The reusable DCEL base remains a separate [repository](https://github.com/zlatmar/DCEL). This restoration also fixes its `getFace` implementation and incident-face setter. When publishing the changes, commit those two files in the DCEL repository first, then update this repository's submodule pointer. A parent-only commit will not publish uncommitted submodule changes.

MIT license; see `LICENSE`.
