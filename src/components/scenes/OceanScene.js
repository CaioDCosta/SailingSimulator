import * as Dat from 'dat.gui';
import * as THREE from 'three';
import { Boat, Chunks } from 'objects';
import { Sun } from 'lights';
import { Perlin } from 'utils';
import TEXTURE from '../objects/res/ToonEquirectangular.png';
import { ArrowHelper } from 'three';
import { Vector3 } from 'three';

class OceanScene extends THREE.Scene {
    constructor(interval, controls, camera) {
        // Call parent Scene() constructor
        super();

        this.controls = controls;
        this.camera = camera;

        // Init state
        this.state = {
            time: 0,
            gui: new Dat.GUI(), // Create GUI for scene
            windHeading: 0, // Wind direction in radians
            windDirection: new THREE.Vector3(),
            windSpeed: 5,
            boatChunk: undefined,
            chunks: [],
            updateList: [],
        };

        this.params = {
            interval: interval,
            fog: true,
            lights: {
                intensity: 2,
                color: 0xffb400,
                azimuth: 0.05,
                zenith: Math.PI / 4,
                distance: 4500,
                focus: 1,
            },
            boat: {
                mass: 1,
                forceMultiplier: 2,
                maxVelocity: 10,
                drag: 0.1,
                turningSpeed: .75,
            },
            wave: {
                medianWavelength: 10,
                width: 200,
                height: 200,
                minSize: 40,
                maxSize: 60,
                g: 9.8,
                usePerlinNoiseInHeight: true,
                waveHeightPerlinFreq: 0.05,
                waveHeightPerlinAmplitude: 1,
                kappa0: 1,
                kappaX: 1,
                kappaY: 1,
                modelBreaking: false,
                modelDepth: false,
                steepnessMultiplier: 0.75,
                numTrains: 1,
                lambda: 1,
                waveSpeedFactor: 1,
                holiness: 2,
            },
            chunk: {
                seafloor: {
                    oct: 3,
                    gain: 1,
                    lac: 1.3,
                    init_amp: 0.5,
                    init_freq: 0.01,
                    amp: 20,
                    depth: 30,
                },
                island: {
                    minIslandsPerChunk: 0,
                    maxIslandsPerChunk: 3,
                    height: 30,
                    size: 1000,
                    varX: 100,
                    varY: 100,
                    oct: 6,
                    gain: 1.2,
                    lac: 1.8,
                    init_amp: 0.3,
                    init_freq: 0.05,
                    amp: 3,
                    thresholdMin: 10,
                    thresholdMax: 40,
                },
                height: 200,
                width: 200,
                scale: 1,
            },
        };

        let textureEquirec = new THREE.TextureLoader().load(TEXTURE);
        textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
        textureEquirec.encoding = THREE.sRGBEncoding;

        this.background = textureEquirec;

        // Set background to a nice color
        let sceneColor = 0x8e8e8e;

        // Add meshes to scene
        this.boat = new Boat(this);
        this.sun = new Sun(this);
        this.chunks = new Chunks(this);

        let near = 10;
        let far = this.params.chunk.width * 1.5;
        this.fog = new THREE.Fog(sceneColor, near, far);
        this.add(this.sun, this.chunks);
        this.attach(this.boat);



        // Populate GUI
        this.state.gui.add(this.state, 'windSpeed', 0.01, 20);
        this.state.gui.add(this.state, 'windHeading', 0, 2 * Math.PI);
        this.state.gui.add(this.params.boat, 'mass', 0.01, 1);
        this.state.gui.add(this.params.boat, 'forceMultiplier', 1, 100);
        this.state.gui.add(this.params.boat, 'maxVelocity', 0, 20);
        this.state.gui.add(this.params.boat, 'drag', 0, 1);
        this.state.gui.add(this.params.boat, 'turningSpeed', 0.01, 2);
        this.state.gui.add(this.params, 'fog').onChange((showFog) => {
            this.fog.near = showFog ? near : 20000;
            this.fog.far = showFog ? far : 20000;
        });
        let wave = this.state.gui.addFolder('Wave');
        wave.add(this.params.wave, 'steepnessMultiplier', 0, 1);
        wave.add(this.params.wave, 'modelDepth');
        wave.add(this.params.wave, 'modelBreaking');
        wave.add(this.params.wave, 'usePerlinNoiseInHeight');
        wave.add(this.params.wave, 'waveHeightPerlinFreq', 0, 0.1);
        wave.add(this.params.wave, 'waveHeightPerlinAmplitude', 0, 5);
        wave.add(this.params.wave, 'g', 1, 40);
        wave.add(this.params.wave, 'minSize', 0, 100);
        wave.add(this.params.wave, 'maxSize', 0, 100);
        wave.add(this.params.wave, 'medianWavelength', 0.1, 100);
        wave.add(this.params.wave, 'numTrains', 0, 5, 1);
        wave.add(this.params.wave, 'lambda', 0, 5);
        wave.add(this.params.wave, 'kappaX', 0.01, 1);
        wave.add(this.params.wave, 'kappaY', 0.01, 1);
        wave.add(this.params.wave, 'kappa0', 0.01, 1);
        wave.add(this.params.wave, 'waveSpeedFactor', 0, 5);
        wave.add(this.params.wave, 'holiness', 0, 5);

        let lighting = this.state.gui.addFolder('Lighting');
        let updateLighting = () => this.sun.update();
        lighting.add(this.params.lights, 'intensity', 0, 50).onChange(updateLighting);
        lighting.addColor(this.params.lights, 'color').onChange(updateLighting);
        lighting.add(this.params.lights, 'azimuth', 0, Math.PI / 2).onChange(updateLighting);
        lighting.add(this.params.lights, 'zenith', 0, 2 * Math.PI).onChange(updateLighting);

        let seafloor = this.state.gui.addFolder('Seafloor');
        seafloor.add(this.params.chunk.seafloor, 'oct', 0, 10, 1);
        seafloor.add(this.params.chunk.seafloor, 'gain', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'lac', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'init_amp', 0, 1);
        seafloor.add(this.params.chunk.seafloor, 'init_freq', 0, 0.1);
        seafloor.add(this.params.chunk.seafloor, 'amp', 0, 50);

        let updateIslands = (arg) => {
            this.chunks.update(arg);
        };
        seafloor.add(this.params.chunk.seafloor, 'depth', 0, 100).onChange(() => updateIslands());

        let island = this.state.gui.addFolder('Island');
        island.add(this.params.chunk.island, 'minIslandsPerChunk', 0, 5, 1).onChange(() => updateIslands('new'));
        island.add(this.params.chunk.island, 'maxIslandsPerChunk', 0, 5, 1).onChange(() => updateIslands('new'));
        island.add(this.params.chunk.island, 'height', 0, 100).onChange(() => updateIslands('peak'));
        island.add(this.params.chunk.island, 'size', 0, 1000).onChange(() => updateIslands('size'));
        island.add(this.params.chunk.island, 'varX', 0, 100).onChange(() => updateIslands('varX'));
        island.add(this.params.chunk.island, 'varY', 0, 100).onChange(() => updateIslands('varY'));
        island.add(this.params.chunk.island, 'oct', 0, 10, 1).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'gain', 0, 5).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'lac', 0, 5).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'init_amp', 0, 1).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'init_freq', 0, 1).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'amp', 0, 20).onChange((x) => updateIslands());
        island.add(this.params.chunk.island, 'thresholdMin', 0, 100);
        island.add(this.params.chunk.island, 'thresholdMax', 0, 100);

        this.ah = new ArrowHelper(new Vector3(), new Vector3(0, 3, 0));
        this.ah2 = new ArrowHelper(new Vector3(), new Vector3(0, 5, 0), 10, 0xff0000);

        this.add(this.ah, this.ah2);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(deltaT) {
        this.state.windDirection.set(Math.cos(this.state.windHeading), 0, Math.sin(this.state.windHeading));
        this.ah.setDirection(this.state.windDirection);
        this.ah2.setDirection(new THREE.Vector3(Math.sin(this.boat.rotation.y - Math.PI), 0, Math.cos(this.boat.rotation.y - Math.PI)));
        // Call update for each object in the updateList
        for (const obj of this.state.updateList) {
            obj.update(deltaT);
        }
        let time = this.state.time;
        const camRotation = this.controls.getAzimuthalAngle();
        this.boat.rudder.mesh.rotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camRotation - this.boat.rotation.y));
        const deltaRot = this.boat.rotation.y + (camRotation - this.boat.rotation.y) * this.params.boat.turningSpeed * this.params.interval;
        this.boat.rotTween.to({ y: deltaRot }, this.params.interval).start(time);
        let offset = Perlin.noise(time * 1.248, time * 3.456, time * 2.122, 0.05) / 10 - .15;
        this.boat.tween.to({ y: this.chunks.getWaterHeight(0, 0) + offset }, this.params.interval).start(time);
        this.chunks.translate(-this.boat.velocity.x * deltaT, -this.boat.velocity.z * deltaT);
        this.state.time += deltaT;
    }
}

export default OceanScene;
