import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const size = 1000;
const sizeHalf = size / 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Setup a camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 4000 );
camera.position.set(1100, 400, 0);

// Setup camera controller
const controls = new OrbitControls( camera, renderer.domElement );

controls.enableZoom = true;
controls.maxDistance = 3000;

// Setup a scene
const scene = new THREE.Scene();

// A grid
const helperGroup = new THREE.Group();
scene.add( helperGroup );

const material = new THREE.MeshBasicMaterial({ color: '#0074D9' });
const gridHelper = new THREE.GridHelper(size, size / 10, "hsl(0, 0%, 50%)", "hsl(0, 0%, 70%)");
gridHelper.rotation.x = Math.PI / 2;
gridHelper.position.z = -sizeHalf / 2;

scene.add(gridHelper);
const boxMesh = new THREE.Mesh( new THREE.BoxGeometry( size, size , sizeHalf ), material.clone() );
boxMesh.position.y = 0;
const boxHelper = new THREE.BoxHelper( boxMesh );
(boxHelper.material as THREE.MeshBasicMaterial).color.setHex( 0xFFFFFF );
scene.add( boxHelper );
camera.up.set(0,0,1);

let group = new THREE.Group();
scene.add( group );

camera.position.z = 5;

function animate() {

    requestAnimationFrame( animate );

	controls.update();

	renderer.render( scene, camera );
};

animate();
