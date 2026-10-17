import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import textureUrl from './textures/disc.png';
import { ConvexHull } from './classes/ConvexHull';
import { advanceParticles, BOX_HALF_SIZE, createParticles, seededRandom } from './simulation';
import './style.css';

const count = 50;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <section class="panel" aria-label="Animation controls">
    <h1>Convex hull <span>3D</span></h1>
    <p>50 moving points. One changing boundary.</p>
    <div class="actions"><button id="pause" type="button">Pause</button><button id="reset" type="button">New points</button></div>
    <label class="speed">Speed <input id="speed" type="range" min="0.1" max="3" step="0.1" value="1"><output id="speed-value">1.0×</output></label>
    <label><input id="rotate" type="checkbox"> Rotate view</label>
    <p id="status" role="status"></p>
    <p class="hint">Drag to orbit · Scroll to zoom</p>
  </section>`;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Animated three dimensional convex hull');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#080e18');

const camera = new THREE.PerspectiveCamera(60, 1, 1, 5000);
camera.up.set(0, 0, 1);
camera.position.set(1150, 850, 650);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 350;
controls.maxDistance = 3000;
controls.autoRotateSpeed = 0.5;

const boxGeometry = new THREE.BoxGeometry(BOX_HALF_SIZE.x * 2, BOX_HALF_SIZE.y * 2, BOX_HALF_SIZE.z * 2);
const boxEdges = new THREE.EdgesGeometry(boxGeometry);
boxGeometry.dispose();
const boxMaterial = new THREE.LineBasicMaterial({ color: '#5a7290', transparent: true, opacity: 0.5 });
scene.add(new THREE.LineSegments(boxEdges, boxMaterial));
const grid = new THREE.GridHelper(1000, 10, '#31435b', '#1b293c');
grid.rotation.x = Math.PI / 2;
grid.position.z = -BOX_HALF_SIZE.z;
scene.add(grid);

const positions = new Float32Array(count * 3);
const pointGeometry = new THREE.BufferGeometry();
const pointAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
pointGeometry.setAttribute('position', pointAttribute);
const sprite = new THREE.TextureLoader().load(textureUrl);
const pointMaterial = new THREE.PointsMaterial({ color: '#ffffff', size: 7, sizeAttenuation: false, alphaTest: 0.5, map: sprite });
const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
pointCloud.frustumCulled = false;
scene.add(pointCloud);

// A triangulated 3D hull has at most 2n-4 faces. Keep GPU buffers for the whole session.
const hullPositions = new Float32Array((2 * count - 4) * 9);
const hullAttribute = new THREE.BufferAttribute(hullPositions, 3).setUsage(THREE.DynamicDrawUsage);
const hullGeometry = new THREE.BufferGeometry();
hullGeometry.setAttribute('position', hullAttribute);
const hullMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: '#64d8f5', transparent: true, opacity: 0.8 });
const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
hullMesh.frustumCulled = false;
scene.add(hullMesh);

const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const speedInput = document.querySelector<HTMLInputElement>('#speed')!;
const rotateInput = document.querySelector<HTMLInputElement>('#rotate')!;
const speedValue = document.querySelector<HTMLOutputElement>('#speed-value')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
let particles = createParticles(count);
let points = particles.map(particle => particle.point);
let running = true;
let speed = 1;
let frame = 0;
let previousTime = 0;
let disposed = false;

function updateHull(): void {
    try {
        const hull = new ConvexHull(points, { random: seededRandom(42) });
        const coordinates = hull.getFaces();
        hullPositions.set(coordinates);
        hullGeometry.setDrawRange(0, coordinates.length / 3);
        hullAttribute.needsUpdate = true;
        points.forEach((point, i) => positions.set([point.x, point.y, point.z], i * 3));
        pointAttribute.needsUpdate = true;
        status.textContent = `${coordinates.length / 9} faces · ${running ? 'Live' : 'Paused'}`;
    } catch (error) {
        running = false;
        hullGeometry.setDrawRange(0, 0);
        pauseButton.textContent = 'Resume';
        status.textContent = `Animation stopped: ${error instanceof Error ? error.message : 'Hull calculation failed.'}`;
        console.error(error);
    }
}

pauseButton.onclick = () => {
    running = !running;
    pauseButton.textContent = running ? 'Pause' : 'Resume';
    updateHull();
};
resetButton.onclick = () => {
    particles = createParticles(count);
    points = particles.map(particle => particle.point);
    updateHull();
};
speedInput.oninput = () => { speed = Number(speedInput.value); speedValue.value = `${speed.toFixed(1)}×`; };
rotateInput.onchange = () => { controls.autoRotate = rotateInput.checked; };

function resize(): void {
    const width = app.clientWidth, height = app.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    // Preserve horizontal framing when the window becomes narrower than it is tall.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(Math.PI / 6) / Math.min(1, camera.aspect)));
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
updateHull();

function animate(time: number): void {
    if (disposed) return;
    const seconds = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    if (running && seconds > 0) {
        advanceParticles(particles, seconds * speed);
        updateHull();
    }
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
}
frame = requestAnimationFrame(animate);

function dispose(): void {
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    controls.dispose();
    pointGeometry.dispose(); hullGeometry.dispose(); boxEdges.dispose(); grid.geometry.dispose();
    pointMaterial.dispose(); hullMaterial.dispose(); boxMaterial.dispose(); sprite.dispose();
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach(material => material.dispose());
    renderer.dispose();
    app.replaceChildren();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
