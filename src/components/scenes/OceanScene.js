import * as Dat from 'dat.gui';
import * as THREE from 'three';
import { Boat, Chunk } from 'objects';
import { BasicLights } from 'lights';

class OceanScene extends THREE.Scene {
    constructor(camera) {
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
            timestep: 18 / 1000,
            boat: {
                mass: 1,
                forceMultiplier: 1
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
                height: 201,
                width: 201,
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
        let targetSize = 500;

        this.camera = camera;

        let chunkHalfWidth = this.params.chunk.width / 2;
        let chunkHalfHeight = this.params.chunk.height / 2
        let cornerWidth = targetSize - chunkHalfWidth;
        let cornerHeight = targetSize - chunkHalfHeight;
        const cornerGeometry = new THREE.PlaneGeometry(cornerWidth, cornerHeight);
        const boundaryMaterial = new THREE.MeshStandardMaterial({ color: 0x0010ff, side: THREE.DoubleSide });
        let corner1 = new THREE.Mesh(cornerGeometry, boundaryMaterial);
        let corner2 = new THREE.Mesh(cornerGeometry, boundaryMaterial);
        let corner3 = new THREE.Mesh(cornerGeometry, boundaryMaterial);
        let corner4 = new THREE.Mesh(cornerGeometry, boundaryMaterial);


        corner1.translateX(cornerWidth / 2 + chunkHalfWidth - 0.5);
        corner1.translateZ(cornerHeight / 2 + chunkHalfHeight - 0.5);
        corner2.translateX(-(cornerWidth / 2 + chunkHalfWidth - 0.5));
        corner2.translateZ(cornerHeight / 2 + chunkHalfHeight - 0.5);
        corner3.translateX(-(cornerWidth / 2 + chunkHalfWidth - 0.5));
        corner3.translateZ(-(cornerHeight / 2 + chunkHalfHeight - 0.5));
        corner4.translateX(cornerWidth / 2 + chunkHalfWidth - 0.5);
        corner4.translateZ(-(cornerHeight / 2 + chunkHalfHeight - 0.5));

        corner1.rotation.x += Math.PI / 2;
        corner2.rotation.x += Math.PI / 2;
        corner3.rotation.x += Math.PI / 2;
        corner4.rotation.x += Math.PI / 2;

        this.add(corner1, corner2, corner3, corner4);

        let chunkThreeHalvesHeight = 3 * chunkHalfHeight;
        let chunkThreeHalvesWidth = 3 * chunkHalfWidth;

        let edgeHeight = targetSize - chunkThreeHalvesHeight;
        let edgeWidth = targetSize - chunkThreeHalvesWidth;
        const edgeGeometryHeight = new THREE.PlaneGeometry(this.params.chunk.width, edgeHeight);
        let edgez1 = new THREE.Mesh(edgeGeometryHeight, boundaryMaterial);
        let edgez2 = new THREE.Mesh(edgeGeometryHeight, boundaryMaterial);
        edgez1.translateZ(edgeHeight / 2 + chunkThreeHalvesHeight - 2);
        edgez2.translateZ(-(edgeHeight / 2 + chunkThreeHalvesHeight - 2));
        edgez1.rotation.x += Math.PI / 2;
        edgez2.rotation.x += Math.PI / 2;

        const edgeGeometryWidth = new THREE.PlaneGeometry(edgeWidth, this.params.chunk.height);
        let edgex1 = new THREE.Mesh(edgeGeometryWidth, boundaryMaterial);
        let edgex2 = new THREE.Mesh(edgeGeometryWidth, boundaryMaterial);
        edgex1.translateX(edgeWidth / 2 + chunkThreeHalvesWidth - 2);
        edgex2.translateX(-(edgeWidth / 2 + chunkThreeHalvesWidth - 2));
        edgex1.rotation.x += Math.PI / 2;
        edgex2.rotation.x += Math.PI / 2;
        edgex1.rotation.y += Math.PI;
        edgex2.rotation.y += Math.PI;
        this.add(edgez1, edgez2, edgex1, edgex2);

        let average = (this.params.chunk.height + this.params.chunk.width) / 2;
        // this.fog = new THREE.Fog(sceneColor, average / 10, average);

        for (let r = -1; r <= 1; r++) {
            let chunks = [];
            for (let c = -1; c <= 1; c++) {
                chunks.push(new Chunk(this,
                    r * (this.params.chunk.width - 1) * this.params.chunk.scale,
                    c * (this.params.chunk.height - 1) * this.params.chunk.scale,
                    r * c == 0));
            }
            this.state.chunks.push(chunks);
        }
        this.state.boatChunk = this.state.chunks[1][1];
        this.add(boat, lights, ...this.state.chunks.flat());

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'windSpeed', 0, 20);
        this.state.gui.add(this.state, 'windHeading', 0, 2 * Math.PI);
        this.state.gui.add(this.params.boat, 'mass', 0.01, 1);
        this.state.gui.add(this.params.boat, 'forceMultiplier', 1, 100);
        this.state.gui.add(this.params, 'timestep', 0.01, .5);


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
            this.state.chunks.flat().map(x => x.land.updateIslands(arg));
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

    update(timeStamp) {
        this.camera.target = this.boat.position;
        const { rotationSpeed, updateList } = this.state;
        this.boat.rotation.y += rotationSpeed / 100;
        this.state.windDirection.set(Math.cos(this.state.windHeading), 0, Math.sin(this.state.windHeading));
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(this.params.timestep);
        }
        ;
    }
}

export default OceanScene;
