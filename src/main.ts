import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import textureUrl from './textures/disc.png'
import { ConvexHull } from './classes/ConvexHull';
import { IConvexPoint } from './interfaces';

interface IPointsMovement {
	velocity: THREE.Vector3
}

const size = 1000;
const sizeHalf = size / 2;
const pointsCount = 50;
const maxPointsCount = 1000;
const pointsData: IPointsMovement[] = [];


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Setup a camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 4000 );
camera.position.set(1100, 400, 0);

// Setup camera controller
const controls = new OrbitControls( camera, renderer.domElement );

controls.enableZoom = true;
controls.autoRotateSpeed = -1;
controls.maxDistance = 3000;

// Setup your scene
const scene = new THREE.Scene();

// A grid
const helperGroup = new THREE.Group();
scene.add( helperGroup );

const material = new THREE.MeshBasicMaterial({ color: '#0074D9' });
const gridHelper = new THREE.GridHelper(size, size / 10, "hsl(0, 0%, 50%)", "hsl(0, 0%, 70%)");
gridHelper.rotation.x = Math.PI / 2;
gridHelper.position.z = -sizeHalf / 2;

scene.add(gridHelper);
const boxMesh = new THREE.Mesh( new THREE.BoxGeometry( size, size , size / 2 ), material.clone() );
boxMesh.position.y = 0;
const boxHelper = new THREE.BoxHelper( boxMesh );
(boxHelper.material as THREE.MeshBasicMaterial).color.setHex( 0xFFFFFF );
scene.add( boxHelper );
camera.up.set(0,0,1);

const pointsPositions = new Float32Array( maxPointsCount * 3 );

let points: Array<IConvexPoint> = [];
for ( let i = 0; i < pointsCount; i++ ) {
    const point: IConvexPoint = {
        number: i + 1,
        x: THREE.MathUtils.randFloatSpread( size - 100 ),
        y: THREE.MathUtils.randFloatSpread( size - 100 ),
        z: THREE.MathUtils.randFloatSpread( size / 4 )
    };
	pointsPositions[ i * 3 ] = point.x;
	pointsPositions[ i * 3 + 1 ] = point.y;
	pointsPositions[ i * 3 + 2 ] = point.z;
    
    points.push(point);
	
    pointsData.push({
		velocity: new THREE.Vector3( -1 * Math.random() * 2, -1 * Math.random() * 2, -1 * Math.random() * 2 )
	});
}

let vectors: Array<THREE.Vector3> = [];
for (let i = 0; i < pointsCount; i++) {
	vectors.push(new THREE.Vector3(pointsPositions[ i * 3 ], pointsPositions[ i * 3 + 1 ], pointsPositions[ i * 3 + 2 ]))
}

const geometry = new THREE.BufferGeometry();
geometry.setDrawRange( 0, pointsCount );
geometry.setAttribute( 'position', new THREE.BufferAttribute( pointsPositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );

const sprite = new THREE.TextureLoader().load( textureUrl );
const pMaterial = new THREE.PointsMaterial({
	color: 0xFFFFFF,
	size: 10,
	sizeAttenuation: false,
	alphaTest: 0.5,
	map: sprite,
});

const pointCloud = new THREE.Points( geometry, pMaterial );
scene.add(pointCloud)

let group = new THREE.Group();
scene.add( group );

const ch = new ConvexHull([...points]);

const coords: number[] = ch.getFaces()

let vertsArray = new Float32Array(coords);

let geometryCustom = new THREE.BufferGeometry();
let bufferGeometryCustom = new THREE.BufferAttribute( vertsArray, 3 );
geometryCustom.setAttribute( 'position', bufferGeometryCustom);
const materialCustom = new THREE.MeshBasicMaterial({
    side: THREE.FrontSide,
	wireframe: true,
    color: 0xFFFFFF
});

// Create a mesh
const meshCustom = new THREE.Mesh(geometryCustom, materialCustom);
scene.add(meshCustom);

camera.position.z = 5;

const animate = () => {
    requestAnimationFrame( animate );

	controls.update();

	renderer.render( scene, camera );
};

animate();
