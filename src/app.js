/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, Clock } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OceanScene } from 'scenes';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

// Initialize core ThreeJS components
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(6, 3, -10);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

const clock = new Clock();
let delta = 0;
const interval = 1 / 60; // Target 30 FPS
let time = 0;

const scene = new OceanScene(interval);

// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 1000;
controls.update();

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    window.requestAnimationFrame(onAnimationFrameHandler);
    delta += clock.getDelta();
    if (delta > interval) {
        time += interval;
        controls.update();
        TWEEN.update(time * 1000);
        renderer.render(scene, camera);
        scene.update && scene.update(interval);
        delta %= interval;
    }
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);