import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector3 } from 'three';
import { ConvexHull as QuickHull } from 'three/examples/jsm/math/ConvexHull.js';
import { loadSource } from './load-source.mjs';

const { ConvexHull } = loadSource('src/classes/ConvexHull.ts');
const { orientation, areCollinear } = loadSource('src/geometry/predicates.ts');
const { advanceParticles, createParticles, seededRandom, BOX_HALF_SIZE } = loadSource('src/simulation.ts');
const points = coords => coords.map(([x, y, z], i) => ({ number: i + 1, x, y, z }));
const tetra = points([[0,0,0],[1,0,0],[0,1,0],[0,0,1]]);
const cube = points([[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]]);
const build = (input, seed = 1) => new ConvexHull(input, { random: seededRandom(seed), validate: true });
const vec = p => [p.x, p.y, p.z];
const subtract = (a,b) => a.map((v,i) => v-b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
function volume(coords) {
    const origin = coords.slice(0,3);
    let result = 0;
    for(let i=0;i<coords.length;i+=9) result += dot(subtract(coords.slice(i,i+3),origin),cross(subtract(coords.slice(i+3,i+6),origin),subtract(coords.slice(i+6,i+9),origin)))/6;
    return result;
}
function reference(input) {
    const hull = new QuickHull().setFromPoints(input.map(p => new Vector3(p.x,p.y,p.z)));
    return hull.faces.flatMap(face => [face.edge,face.edge.next,face.edge.prev].flatMap(edge => edge.vertex.point.toArray()));
}
function compare(input, seed = 1) {
    const actual = build(input,seed).getFaces(), expected = reference(input);
    const v = volume(actual), ref = volume(expected);
    assert.ok(v > 0, 'outward winding must produce positive volume');
    assert.ok(Math.abs(v-ref) <= Math.abs(ref)*1e-9, `volume ${v} differs from reference ${ref}`);
    return actual;
}
function permutations(values) {
    if (!values.length) return [[]];
    return values.flatMap((value,i) => permutations(values.filter((_,j) => i!==j)).map(rest => [value,...rest]));
}

test('predicates classify axis normals, collinearity, and exact coplanarity', () => {
    assert.ok(orientation(...tetra) > 0);
    assert.equal(areCollinear(...points([[0,0,0],[1,1,1],[2,2,2]])),true);
    assert.equal(areCollinear(...tetra.slice(0,3)),false);
    assert.ok(orientation(...points([[3,-5,-2],[2,7,-6],[10,8,-4],[9,20,-8]])) === 0);
});

test('all tetrahedron permutations have valid outward topology', () => {
    for(const input of permutations(tetra)) assert.equal(compare(input).length,36);
});

test('review failures: cube, collinear prefix, duplicate coordinates, and axis visibility', () => {
    const fixtures = [cube,points([[0,0,0],[1,1,1],[2,2,2],[0,1,0],[0,0,1]]),points([[0,0,0],[0,0,0],[1,0,0],[0,1,0],[0,0,1]]),points([[0,0,0],[1,0,0],[0,0,1],[0,1,0],[-1,0.2,0.2]])];
    for(const input of fixtures) for(let seed=1;seed<=30;seed++) compare(input,seed);
});

test('coplanar boundary vertices and interior points across insertion orders', () => {
    const transformed = cube.map(p => ({...p,x:p.x+2*p.y+3*p.z,y:2*p.x-p.y+p.z,z:3*p.x+4*p.y-2*p.z}));
    const lattice = points(Array.from({length:27},(_,i)=>[i%3,Math.floor(i/3)%3,Math.floor(i/9)]));
    for(let seed=1;seed<=40;seed++) { compare(transformed,seed); compare(lattice,seed); }
});

test('100 random and 100 integer-grid clouds agree in volume with QuickHull', () => {
    for(let seed=1;seed<=100;seed++) {
        const random = seededRandom(seed);
        const input = points(Array.from({length:50},()=>[random()*900-450,random()*900-450,random()*250-125]));
        const output = compare(input,seed);
        assert.equal(output.length,reference(input).length);
        compare(input.map(p=>({...p,x:Math.round(p.x/90),y:Math.round(p.y/90),z:Math.round(p.z/25)})),seed);
    }
});

test('translation, scale, reflection, and nearly planar clouds preserve valid hulls', () => {
    for(let seed=1;seed<=20;seed++) {
        const input = createParticles(30,seededRandom(seed)).map(p=>p.point);
        for(const scale of [1e-9,1,1e9,-1]) compare(input.map(p=>({...p,x:p.x*scale,y:p.y*scale,z:p.z*scale})),seed);
        compare(input.map(p=>({...p,x:p.x+1e12,y:p.y+1e12,z:p.z+1e12})),seed);
        // QuickHull uses a distance tolerance; exact containment is the check for this sliver.
        build(input.map(p=>({...p,z:p.z*1e-14})),seed).assertValid();
    }
});

test('invalid and lower-dimensional inputs fail explicitly without mutating caller data', () => {
    assert.throws(()=>build([]),/four distinct/);
    assert.throws(()=>build(points([[0,0,0],[1,0,0],[2,0,0],[3,0,0]])),/collinear/);
    assert.throws(()=>build(points([[0,0,0],[1,0,0],[0,1,0],[1,1,0]])),/coplanar/);
    assert.throws(()=>build(tetra.map((p,i)=>({...p,number:i===1?1:p.number}))),/unique/);
    for(const x of [NaN,Infinity,-Infinity]) assert.throws(()=>build(tetra.map((p,i)=>i? p : {...p,x})),/finite/);
    assert.throws(()=>build(tetra.map((p,i)=>i? p : {...p,x:1e100})),/magnitude/);
    assert.throws(()=>new ConvexHull(cube,{random:()=>1}),/random source/);
    const input = structuredClone(cube), before = structuredClone(input);
    build(input);
    assert.deepEqual(input,before);
});

test('reflections preserve bounds and speed even through multiple collisions', () => {
    const particles = [{point:{number:1,x:499,y:-499,z:249},velocity:{x:120,y:-150,z:250}}];
    const speed = Math.hypot(...vec(particles[0].velocity));
    advanceParticles(particles,25);
    for(const axis of ['x','y','z']) assert.ok(Math.abs(particles[0].point[axis]) <= BOX_HALF_SIZE[axis]);
    assert.equal(Math.hypot(...vec(particles[0].velocity)),speed);
    const oneStep = createParticles(50,seededRandom(4)), manySteps = structuredClone(oneStep);
    advanceParticles(oneStep,50);
    for(let i=0;i<500;i++) advanceParticles(manySteps,0.1);
    for(let i=0;i<50;i++) for(const axis of ['x','y','z']) {
        assert.ok(Math.abs(oneStep[i].point[axis]-manySteps[i].point[axis])<1e-8);
        assert.equal(oneStep[i].velocity[axis],manySteps[i].velocity[axis]);
    }
});

test('movement is frame-rate independent and a zero step pauses it', () => {
    const samples = [30,60,144].map(rate=>{
        const particles=createParticles(10,seededRandom(5));
        for(let frame=0;frame<rate*10;frame++) advanceParticles(particles,1/rate);
        return particles;
    });
    for(const sample of samples.slice(1)) for(let i=0;i<10;i++) for(const axis of ['x','y','z']) assert.ok(Math.abs(sample[i].point[axis]-samples[0][i].point[axis])<1e-8);
    const paused = structuredClone(samples[0]);
    advanceParticles(paused,0);
    assert.deepEqual(paused,samples[0]);
});

test('1,000 animated frames remain bounded with valid rebuilt hulls', () => {
    const particles = createParticles(50,seededRandom(1234));
    for(let frame=0;frame<1000;frame++) {
        advanceParticles(particles,1/60);
        const input=particles.map(particle=>particle.point);
        for(const p of input) for(const axis of ['x','y','z']) assert.ok(Math.abs(p[axis])<=BOX_HALF_SIZE[axis]);
        build(input,42);
    }
});
