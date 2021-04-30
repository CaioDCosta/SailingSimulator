import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import * as THREE from 'three';
import { Boat, Chunk } from 'objects';
import { BasicLights } from 'lights';

class OceanScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 0,
            windHeading: 0, // Wind direction in radians
            windDirection: new THREE.Vector3(),
            windSpeed: 1,
            updateList: [],
        };

        this.params = {
            chunk: {
                wave: {
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
                    depth: 20
                },
                island: {
                    islandsPerChunk: 3,
                    height: 40,
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
                height: 201,
                width: 201,
                scale: 1
            },
        }

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Add meshes to scene    
        const boat = new Boat(this);
        this.boat = boat;
        const lights = new BasicLights();
        const chunk = new Chunk(this);
        this.add(boat, lights, chunk);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'windSpeed', 0, 20);
        this.state.gui.add(this.state, 'windHeading', 0, 2 * Math.PI);
        let wave = this.state.gui.addFolder("Wave");
        wave.add(this.params.chunk.wave, "g", 0, 40);
        wave.add(this.params.chunk.wave, "lambda", 0, 5);
        let seafloor = this.state.gui.addFolder("Seafloor");
        seafloor.add(this.params.chunk.seafloor, 'oct', 0, 10, 1);
        seafloor.add(this.params.chunk.seafloor, 'gain', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'lac', 0, 5);
        seafloor.add(this.params.chunk.seafloor, 'init_amp', 0, 1);
        seafloor.add(this.params.chunk.seafloor, 'init_freq', 0, .1);
        seafloor.add(this.params.chunk.seafloor, 'amp', 0, 50);
        seafloor.add(this.params.chunk.seafloor, 'depth', 0, 100);
        let island = this.state.gui.addFolder("Island");
        island.add(this.params.chunk.island, 'islandsPerChunk', 0, 5, 1).onChange(x => chunk.land.generateIslands());
        island.add(this.params.chunk.island, 'height', 0, 100).onChange(x => chunk.land.updateIslands('height'));
        island.add(this.params.chunk.island, 'size', 0, 1000).onChange(x => chunk.land.updateIslands('size'));
        island.add(this.params.chunk.island, 'varX', 0, 100).onChange(x => chunk.land.updateIslands('varX'));
        island.add(this.params.chunk.island, 'varY', 0, 100).onChange(x => chunk.land.updateIslands('varY'));
        island.add(this.params.chunk.island, 'oct', 0, 10, 1).onChange(x => chunk.land.updateIslands());
        island.add(this.params.chunk.island, 'gain', 0, 5).onChange(x => chunk.land.updateIslands());
        island.add(this.params.chunk.island, 'lac', 0, 5).onChange(x => chunk.land.updateIslands());
        island.add(this.params.chunk.island, 'init_amp', 0, 1).onChange(x => chunk.land.updateIslands());
        island.add(this.params.chunk.island, 'init_freq', 0, 1).onChange(x => chunk.land.updateIslands());
        island.add(this.params.chunk.island, 'amp', 0, 20).onChange(x => chunk.land.updateIslands());
        island.add(this.params.chunk.island, 'thresholdMin', 0, 100);
        island.add(this.params.chunk.island, 'thresholdMax', 0, 100);


    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { rotationSpeed, updateList } = this.state;
        this.boat.rotation.y += rotationSpeed / 100;
        this.state.windDirection.set(Math.cos(this.state.windHeading), 0, Math.sin(this.state.windHeading));
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default OceanScene;
