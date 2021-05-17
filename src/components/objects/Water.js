import * as THREE from 'three';
import { Train } from 'objects';
import TEXTURE from './res/water_normals.png';
import ENVMAP from './res/ToonEquirectangular.png';
class Water extends THREE.Group {
    constructor(scene, chunks) {
        // Call parent Group() constructor
        super();
        this.params = scene.params.wave;
        this.params.id = 1;
        this.time = 0;
        this.scene = scene;
        this.previousTimeStamp = 0;
        this.chunks = chunks;
        this.segsPerUnit = 1;
        let width = this.params.width, height = this.params.height;
        this.xSegs = this.params.width * this.segsPerUnit;
        this.zSegs = this.params.height * this.segsPerUnit;
        this.prevHeading = this.scene.state.windHeading;
        this.geometry = new THREE.PlaneBufferGeometry(width, height, this.xSegs, this.zSegs);
        this.geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        this.geometry.attributes.uv2 = this.geometry.attributes.uv;
        const loader = new THREE.TextureLoader();
        const bumpTexture = loader.load(TEXTURE);
        bumpTexture.repeat = new THREE.Vector2(16, 16);
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
        const aoTexture = loader.load(TEXTURE);
        aoTexture.repeat = new THREE.Vector2(16, 16);
        aoTexture.wrapS = aoTexture.wrapT = THREE.RepeatWrapping;

        const envMap = loader.load(ENVMAP);
        this.material = new THREE.MeshPhysicalMaterial({
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transmission: .4,
            ior: .1,
            reflectivity: .7,
            roughness: 0.5,
            opacity: 1,
            color: 0x0010ff,
            side: THREE.FrontSide,
            envMap: envMap,
            bumpMap: bumpTexture,
            transparent: true
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        let bw = 0.75 * this.params.width, bh = 0.75 * this.params.height;
        let params2 = {
            position: new THREE.Vector3(0, 0, 0),
            size: new THREE.Vector3(bw, 0, bh),
            baseHeading: this.scene.state.windHeading - Math.random() * Math.PI / 4,
            steepness: 0.5,
            wavelengthWindFactor: 1,
            baseWavelength: 3,
            heightFreq: 1,
            numHoles: 500,
            background: true,
        }
        let params3 = {
            position: new THREE.Vector3(0, 0, 0),
            size: new THREE.Vector3(bw, 0, bh),
            baseHeading: this.scene.state.windHeading + Math.random() * Math.PI / 4,
            steepness: 0.5,
            wavelengthWindFactor: 1,
            baseWavelength: 3,
            heightFreq: 1,
            numHoles: 500,
            background: true,
        }
        this.trains = [new Train(this.scene, params2), new Train(this.scene, params3)];

        this.numBackgroundTrains = this.trains.length;

        for (let i = 0; i < this.params.numTrains; i++) {
            this.generateNewTrain();
        }

        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;

        this.add(this.mesh);
        this.scene.addToUpdateList(this);
    }

    index(u, v) { return v * (this.zSegs + 1) + u; }

    updateTrains(deltaT) {
        for (let train of this.trains) {
            train.update(deltaT, this.scene.state.windHeading - this.prevHeading);
        }
        this.prevHeading = this.scene.state.windHeading;
    }

    getRestingPosFromIndex(u, v) {
        let x = u / this.segsPerUnit - this.params.width / 2;
        let z = v / this.segsPerUnit - this.params.height / 2;
        return [x, z];
    }

    update(deltaT) {
        this.time += deltaT;

        if (this.trains.length - this.numBackgroundTrains != this.params.numTrains) {
            for (let i = this.trains.length; i < this.params.numTrains + this.numBackgroundTrains; i++) {
                this.generateNewTrain();
            }
            for (let i = this.trains.length; i > this.params.numTrains + this.numBackgroundTrains; i--) {
                this.trains.pop();
            }
        }

        this.updateTrains(deltaT);
        const checkNumber = (num) => Number.isNaN(num) ? 0 : num;

        // TODO optimize by setting on singleton vector3
        let vec = new THREE.Vector3();
        for (let v = 0; v <= this.zSegs; v++) {
            for (let u = 0; u <= this.xSegs; u++) {
                let i = this.index(u, v);
                let x = u - this.params.width / 2,
                    z = v - this.params.height / 2;
                let y = Math.max(0, this.geometry.getAttribute('position').getY(i));
                vec.set(0, 0, 0);
                let totalSteepness = 0;
                for (let train of this.trains) {
                    if (train.contains(x, z)) totalSteepness += train.params.steepness;
                }
                for (let train of this.trains) {
                    train.getPos(x, z, y, vec, totalSteepness);
                }
                this.geometry.attributes.position.setXYZ(i, x + checkNumber(vec.x), checkNumber(vec.y), z + checkNumber(vec.z));
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.geometry.computeFaceNormals();
    }

    generateNewTrain(index = -1) {
        let params = {
            size: new THREE.Vector3(0, 5, 0),
            position: new THREE.Vector3()
        };
        params.size.x = Math.floor(Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize);
        params.size.z = Math.floor(Math.random() * (this.params.maxSize - params.size.x) + params.size.x);


        // TODO Make sure trains can't spawn at edge that wind dir is pointing at
        const pos = Math.random() - 0.5;
        params.baseHeading = this.scene.state.windHeading + ((Math.random() - 0.5) * Math.PI / 4);
        params.position.x = -Math.cos(params.baseHeading) * this.params.width / 2;
        params.position.z = -Math.sin(params.baseHeading) * this.params.height / 2;

        params.baseWavelength = this.params.medianWavelength * (Math.random() * 3 / 2 + .5);
        params.wavelengthWindFactor = 1.3;
        params.steepness = 1;
        params.numHoles = 50;
        let train = new Train(this.scene, params);

        if (index < 0 || index >= this.trains.length) {
            params.id = this.trains.length;
            this.trains.push(train);
        } else {
            params.id = index;
            this.trains[index] = train;
        }
    }

    translate(x, z) {
        this.material.bumpMap.offset.x -= 16 * x / this.params.width;
        this.material.bumpMap.offset.y -= 16 * z / this.params.height;
        for (let i = 0; i < this.trains.length; i++) {
            let train = this.trains[i];
            train.translate(x, z)
            if (Math.abs(train.params.position.x) > this.params.width / 2|| Math.abs(train.params.position.z) > this.params.height / 2) {
                this.generateNewTrain(i);
            }
        }
    }
}

export default Water;
