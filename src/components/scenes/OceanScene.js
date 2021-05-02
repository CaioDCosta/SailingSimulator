import * as Dat from 'dat.gui';
import * as THREE from 'three';
import { Boat, Chunks } from 'objects';
import { BasicLights } from 'lights';

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
            windSpeed: 1,
            boatChunk: undefined,
            chunks: [],
            updateList: [],
        };

        this.params = {
            interval: interval,
            fog: true,
            boat: {
                mass: 1,
                forceMultiplier: 1,
                velocityMultiplier: 2,
                damping: 0.5
            },
            chunk: {
                wave: {
                    enabled: true,
                    g: 9.8,
                    lambda: 2
                },
                seafloor: {
                    oct: 3,
                    gain: 1,
                    lac: 1.3,
                    init_amp: .5,
                    init_freq: .02,
                    amp: 20,
                    depth: 30
                },
                island: {
                    minIslandsPerChunk: 0,
                    maxIslandsPerChunk: 3,
                    height: 50,
                    size: 500,
                    varX: 100,
                    varY: 100,
                    oct: 6,
                    gain: 1.2,
                    lac: 1.8,
                    init_amp: .3,
                    init_freq: .05,
                    amp: 3,
                    thresholdMin: 10,
                    thresholdMax: 40,
                },
                height: 200,
                width: 200,
                scale: 1
            },
        }

        // Set background to a nice color
        let sceneColor = 0x7ec0ee;
        this.background = new THREE.Color(sceneColor);

        // Add meshes to scene    
        const boat = new Boat(this);
        this.boat = boat;
        const lights = new BasicLights();
        this.chunks = new Chunks(this);

        let near = (this.params.chunk.height + this.params.chunk.width) / 20;
        let far = 1000;
        this.fog = new THREE.Fog(sceneColor, near, far);
        this.add(lights, this.chunks);
        this.attach(boat);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'windSpeed', 0, 20);
        this.state.gui.add(this.state, 'windHeading', 0, 2 * Math.PI);
        this.state.gui.add(this.params.boat, 'mass', 0.01, 1);
        this.state.gui.add(this.params.boat, 'forceMultiplier', 1, 100);
        this.state.gui.add(this.params.boat, 'velocityMultiplier', 0, 3);
        this.state.gui.add(this.params.boat, 'damping', 0, 1);
        this.state.gui.add(this.params, 'fog').onChange((showFog) => this.fog.near = showFog ? near : far);

        let wave = this.state.gui.addFolder("Wave");
        wave.add(this.params.chunk.wave, "g", 0, 40);
        wave.add(this.params.chunk.wave, "lambda", 0, 5);
        wave.add(this.params.chunk.wave, "enabled");
        let seafloor = this.state.gui.addFolder("Seafloor");
        seafloor.add(this.params.chunk.seafloor, 'oct', 0, 10, 1);
        seafloor.add(this.params.chunk.seafloor, 'gain', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'lac', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'init_amp', 0, 1);
        seafloor.add(this.params.chunk.seafloor, 'init_freq', 0, .1);
        seafloor.add(this.params.chunk.seafloor, 'amp', 0, 50);
        seafloor.add(this.params.chunk.seafloor, 'depth', 0, 100);

        let updateIslands = (arg) => {
            this.chunks.update(arg);
        }
        let island = this.state.gui.addFolder("Island");
        island.add(this.params.chunk.island, 'minIslandsPerChunk', 0, 5, 1).onChange(() => updateIslands('num'));
        island.add(this.params.chunk.island, 'maxIslandsPerChunk', 0, 5, 1).onChange(() => updateIslands('num'));
        island.add(this.params.chunk.island, 'height', 0, 100).onChange(() => updateIslands('peak'));
        island.add(this.params.chunk.island, 'size', 0, 1000).onChange(() => updateIslands('size'));
        island.add(this.params.chunk.island, 'varX', 0, 100).onChange(() => updateIslands('varX'));
        island.add(this.params.chunk.island, 'varY', 0, 100).onChange(() => updateIslands('varY'));
        island.add(this.params.chunk.island, 'oct', 0, 10, 1).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'gain', 0, 5).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'lac', 0, 5).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'init_amp', 0, 1).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'init_freq', 0, 1).onChange(() => updateIslands());
        island.add(this.params.chunk.island, 'amp', 0, 20).onChange(x => updateIslands());
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
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(deltaT);
        }
        this.chunks.translate(-this.boat.velocity.x, -this.boat.velocity.z);
    }
}

export default OceanScene;
