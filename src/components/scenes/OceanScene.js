import * as Dat from 'dat.gui';
import * as THREE from 'three';
import { Boat, Chunks } from 'objects';
import { Sun } from 'lights';
import { Perlin } from 'utils';
import TEXTURE from '../objects/res/ToonEquirectangular.png';

class OceanScene extends THREE.Scene {
    constructor(interval) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            time: 0,
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 0,
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
                distance: 500,
                focus: 1,
            },
            boat: {
                mass: 1,
                forceMultiplier: 1,
                velocityMultiplier: 2,
                damping: 0.5,
            },
            wave: {
                enabled: true,
                width: 200,
                height: 200,
                minSize: 40,
                maxSize: 60,
                g: 9.8,
                waveHeightScaling: 1,
                waveHeightFreq: 0.1,
                kappa0: 1,
                kappaX: 1,
                kappaY: 1,
                medianWavelength: 5,
                medianAmplitude: 0.5,
                steepness: 0.5,
                numTrains: 1,
                lambda: 1,
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
        // this.chunks.water.material.envMap = textureEquirec;

        let near = 10;
        let far = this.params.chunk.width * 2;
        this.fog = new THREE.Fog(sceneColor, near, far);
        this.add(this.sun, this.chunks);
        this.attach(this.boat);

        // this.ah = new ArrowHelper(this.windDirection, new THREE.Vector3(0, 1, 0), 20);
        // this.add(this.ah);

        // this.add(new AxesHelper(20));

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'windSpeed', 0, 20);
        this.state.gui.add(this.state, 'windHeading', 0, 2 * Math.PI);
        this.state.gui.add(this.params.boat, 'mass', 0.01, 1);
        this.state.gui.add(this.params.boat, 'forceMultiplier', 1, 100);
        this.state.gui.add(this.params.boat, 'velocityMultiplier', 0, 3);
        this.state.gui.add(this.params.boat, 'damping', 0, 1);
        this.state.gui.add(this.params, 'fog').onChange((showFog) => {
            this.fog.near = showFog ? near : 20000;
            this.fog.far = showFog ? far : 20000;
        });
        let wave = this.state.gui.addFolder('Wave');
        wave.add(this.params.wave, 'medianWavelength', 0.1, 50);
        wave.add(this.params.wave, 'medianAmplitude', 0.1, 5);
        wave.add(this.params.wave, 'steepness', 0, 1);
        wave.add(this.params.wave, 'g', 1, 40);
        wave.add(this.params.wave, 'waveHeightScaling', 0, 3);
        wave.add(this.params.wave, 'waveHeightFreq', 0, 1);
        wave.add(this.params.wave, 'minSize', 0, 100);
        wave.add(this.params.wave, 'maxSize', 0, 100);
        wave.add(this.params.wave, 'numTrains', 0, 5, 1);
        wave.add(this.params.wave, 'lambda', 0, 2);

        let lighting = this.state.gui.addFolder('Lighting');
        let updateLighting = () => this.sun.update();
        lighting.add(this.params.lights, 'intensity', 0, 50).onChange(updateLighting);
        lighting.addColor(this.params.lights, 'color').onChange(updateLighting);
        lighting.add(this.params.lights, 'azimuth', 0, Math.PI / 2).onChange(updateLighting);
        lighting.add(this.params.lights, 'zenith', 0, 2 * Math.PI).onChange(updateLighting);
        lighting.add(this.params.lights, 'distance', 10, 1000).onChange(updateLighting);

        let seafloor = this.state.gui.addFolder('Seafloor');
        seafloor.add(this.params.chunk.seafloor, 'oct', 0, 10, 1);
        seafloor.add(this.params.chunk.seafloor, 'gain', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'lac', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'init_amp', 0, 1);
        seafloor.add(this.params.chunk.seafloor, 'init_freq', 0, 0.1);
        seafloor.add(this.params.chunk.seafloor, 'amp', 0, 50);
        seafloor.add(this.params.chunk.seafloor, 'depth', 0, 100);

        let updateIslands = (arg) => {
            this.chunks.update(arg);
        };
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
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(deltaT) {
        const { rotationSpeed, updateList } = this.state;
        this.boat.rotation.y += rotationSpeed / 100;
        this.state.windDirection.set(Math.cos(this.state.windHeading), 0, Math.sin(this.state.windHeading));
        // this.ah.setDirection(this.state.windDirection);
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(deltaT);
        }
        let time = this.state.time;
        let offset = Perlin.noise(time * 1.248, time * 3.456, time * 2.122, 0.05) / 10 - .15;
        this.boat.tween.to({ y: this.chunks.getWaterHeight(0, 0) + offset }, this.params.interval / 2).start(this.state.time);
        this.chunks.translate(-this.boat.velocity.x, -this.boat.velocity.z);
        this.state.time += deltaT;
    }
}

export default OceanScene;
