/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, Clock, PCFSoftShadowMap, ACESFilmicToneMapping } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OceanScene } from 'scenes';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';

// Initialize core ThreeJS components
const camera = new PerspectiveCamera(50, 1, 0.1, 5000);
const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

// Set up camera
camera.position.set(6, 3, -10);
camera.lookAt(new Vector3(0, 0, 0));
camera.layers.enable(2);

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2 - .1;
controls.update();

let delta = 0;
const interval = 1 / 30; // Target 60 FPS
let time = 0;

const scene = new OceanScene(interval, controls, camera);

let sailY = 0;
function handleSteering(event) {
    // Ignore keypresses typed into a text box
    if (event.target.tagName === "INPUT") { return; }
    if (event.key === 'ArrowLeft') {
        sailY -= scene.params.boat.sailSensitivity;
    }
    else if (event.key === 'ArrowRight') {
        sailY += scene.params.boat.sailSensitivity;
    }
    else if (event.key === 'ArrowUp') {
        sailY = 0;
    }
}

window.addEventListener('keydown', handleSteering);

const clock = new Clock();
const stats = new Stats();
document.body.appendChild(stats.domElement);

const effect = new OutlineEffect(renderer);

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    delta += clock.getDelta();
    if (delta > interval) {
        time += interval;
        controls.update();
        TWEEN.update(time * 1000);
        stats.begin();
        effect.render(scene, camera);
        scene.update && scene.update(interval);
        if (scene.params.boat.autoSail) {
            sailY = scene.boat.rotation.y - scene.state.windHeading + Math.PI / 2;
        }
        sailY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, sailY));
        scene.boat.sail.tween.to({ y: sailY }, interval).start(time);
        stats.end();
        stats.update();
        delta %= interval;
    }
    window.requestAnimationFrame(onAnimationFrameHandler);
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
