# Developer guide

[← Project overview](../README.md) · [Live demo](https://zlatmar.github.io/ConvexHull3D/)

## Local setup

Use Node.js 22 to match CI. Install dependencies with `npm ci` and start Vite with `npm run dev`. The development entry point is `index.html`; opening it directly from the filesystem does not compile the TypeScript modules.

The project includes [DCEL](https://github.com/zlatmar/DCEL) as a Git submodule. If you cloned without `--recursive`, initialize it before building:

```sh
git submodule update --init --recursive
```

When modifying DCEL, publish the submodule changes before updating the parent repository's recorded submodule revision, so other clones can retrieve it.

## Geometry API

Import the engine from `src/classes/ConvexHull.ts`. For example, from a TypeScript module in the project root:

```ts
import { ConvexHull } from './src/classes/ConvexHull';
import { seededRandom } from './src/simulation';

const points = [
    { number: 0, x: 0, y: 0, z: 0 },
    { number: 1, x: 1, y: 0, z: 0 },
    { number: 2, x: 0, y: 1, z: 0 },
    { number: 3, x: 0, y: 0, z: 1 },
    { number: 4, x: 1, y: 1, z: 1 },
];

const hull = new ConvexHull(points, {
    random: seededRandom(42),
    validate: true,
});

const triangles = hull.getFaces(); // flat xyz coordinates, three vertices per triangle
hull.assertValid();               // optional diagnostic check of the completed hull
```

### Input and output contract

- Each point has `{ number, x, y, z }`. Identifiers must be unique safe integers; coordinates must be finite.
- Coordinate-identical points are deduplicated, even when their identifiers differ. The caller's objects and array order are preserved.
- At least four affinely independent points are required. Too few distinct points, collinear sets, and wholly coplanar sets throw descriptive errors; the API does not produce a 2D hull.
- Nonzero coordinate magnitudes must lie in `[1e-75, 1e75]`. Normalize data outside this range before calling the engine.
- `getFaces()` returns outward-wound triangles. Coplanar facets remain triangulated, and their diagonal choices can depend on insertion order.
- The optional `random` callback must return values in `[0, 1)`. It controls insertion order; the default is `Math.random`.
- `validate: true` checks topology and conflict-graph reciprocity after each insertion and validates the completed hull. These checks add work and are intended for diagnostics.

The geometry engine has no Three.js dependency. Adaptive orientation tests determine plane sidedness and collinearity; exactly coplanar points are not considered visible to a face.

## Simulation and rendering

The scene uses 50 particles with randomly initialized positions and velocities. Motion advances in units per second. Reflections account for overshoot and multiple wall crossings; the animation loop caps elapsed simulation time at 50 ms per frame after a browser stall.

Each moving update rebuilds the hull. Point and hull GPU buffers are reused, including after generating new points. Resize updates the canvas and camera projection, and hot reload disposes renderer resources and event handlers.

## Verification

```sh
npm test
npm run build
```

Tests use Node's built-in test runner and an in-memory TypeScript loader. The production build runs the strict TypeScript checker separately. The [CI workflow](../.github/workflows/ci.yml) runs tests and builds on pushes and pull requests.

Three.js QuickHull provides an independent volume comparison for generated clouds. Coplanar facets can have different valid triangulations, so identical triangle lists are not required for those cases. Additional tests check topology, containment, invalid input, motion, and repeated hull reconstruction.

## GitHub Pages

The public demo is **https://zlatmar.github.io/ConvexHull3D/**.

The [deployment workflow](../.github/workflows/pages.yml) checks out submodules, installs dependencies, runs tests, and builds with the project's URL prefix:

```sh
npm run build -- --base=/ConvexHull3D/
```

It publishes `dist` on pushes to `main` and can also be started from **Actions → Deploy live demo → Run workflow**. The repository's **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions**.

Normal local builds retain Vite's default root base. For a fork with a different repository name, update the deployment base and demo links to match its Pages URL.
