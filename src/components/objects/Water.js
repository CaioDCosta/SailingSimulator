import * as THREE from 'three';
import { Color } from 'three';
import { Vector3 } from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { Perlin } from 'utils';
import { Train } from 'objects';
import TEXTURE from './res/water_normals.png';
import ENVMAP from './res/ToonEquirectangular.png';

// const PoissonDiskSampling = require("poisson-disk-sampling");
// class Train {
//     constructor(scene, params) {
//         this.timeOffset = Math.random() * 20;
//         this.scene = scene;
//         this.params = params;
//         this.sceneParams = this.scene.params.wave;
//         this.params.directionVector = new THREE.Vector3(Math.cos(params.direction), 0, Math.sin(params.direction));
//         this.gridSize = 1;
//         this.resetDepth();

//         this.params.freq = 0.5;
//         this.params.speed = this.params.freq * this.params.wavelength / (2 * Math.PI);
//         this.params.phi = this.params.speed * 2 / this.params.wavelength;

//         const pds = new PoissonDiskSampling({
//             shape: [this.params.trainWidth, this.params.trainHeight],
//             minDistance: this.params.wavelength * 1.5,
//             maxDistance: this.params.wavelength * 3,
//             tries: 10
//         })
//         const holes = pds.fill().sort(() => 0.5 - Math.random()).slice(0, this.params.numHoles).map(([x, z]) => [x - this.params.trainWidth / 2, z - this.params.trainHeight / 2]);
//         this.holes = [];

//         for (let x = -Math.ceil(this.params.trainWidth / 2); x <= this.params.trainWidth / 2; x++) {
//             let array = []
//             for (let z = -Math.ceil(this.params.trainHeight / 2); z <= this.params.trainHeight / 2; z++) {
//                 let hole = 0;
//                 for (let [x0, z0] of holes) {
//                     hole += this.gaussian(x, z, x0, z0);
//                 }
//                 array.push(1 - hole);
//             }
//             this.holes.push(array);
//         }
//         this.time = 0;

//         // this.ah = new THREE.ArrowHelper(this.directionVector, new THREE.Vector3(this.xCenter, 5, this.zCenter), 10);
//         // this.scene.add(this.ah);

//     }

//     resetDepth() {
//         this.cumDepth = [];
//         for (let z = 0; z < this.params.trainHeight; z += this.gridSize) {
//             this.cumDepth.push(new Array(Math.ceil(this.params.trainWidth / this.gridSize)).fill(0));
//         }
//     }

//     getPos(x, z, vec, y) {
//         let [u, v] = this.toLocal(x, z);
//         let r = this.envelope(u, v);
//         if (Math.abs(r) < 0.05) return;
//         let depth = this.scene.chunks.getDepth(x, z);
//         let mag, height;
//         if (this.params.fixed) {
//             let arg = this.params.kappaInf * u + this.params.freq * (this.time + this.timeOffset) - this.sceneParams.lambda * y * this.deltaT;
//             mag = this.params.steepness * r * Math.cos(arg);
//             height = r * Math.sin(arg);
//         }
//         else {
//             let slope = this.scene.chunks.getSlope(x, z, this.params.directionVector);

//             let sx = 1 / (1 - Math.exp(-this.sceneParams.kappaX * depth));
//             let sy = sx * (1 - Math.exp(-this.sceneParams.kappaY * depth));
//             let alpha = slope * Math.exp(-this.sceneParams.kappa0 * depth);

//             let cosAlpha = Math.cos(alpha);
//             let sinAlpha = Math.sin(alpha);

//             let uu = (u + this.params.trainWidth / 2) / this.gridSize;
//             let vv = (v + this.params.trainHeight / 2) / this.gridSize;
//             let intDepth00 = this.cumDepth[Math.floor(vv)][Math.floor(uu)];
//             let intDepth01 = this.cumDepth[Math.floor(vv)][Math.ceil(uu)];
//             let intDepth10 = this.cumDepth[Math.ceil(vv)][Math.floor(uu)];
//             let intDepth11 = this.cumDepth[Math.ceil(vv)][Math.ceil(uu)];

//             let intDepth0 = Perlin.lerp(uu - Math.floor(uu), intDepth00, intDepth01);
//             let intDepth1 = Perlin.lerp(uu - Math.floor(uu), intDepth10, intDepth11);
//             let intDepth = Perlin.lerp(vv - Math.floor(vv), intDepth0, intDepth1);
//             let arg =
//                 (intDepth || 0)
//                 - this.params.freq * (this.time + this.timeOffset)
//                 - this.sceneParams.lambda * y * this.deltaT;

//             let cosArg = Math.cos(arg);
//             let sinArg = Math.sin(arg);
//             mag = r * cosAlpha * sx * sinArg + sinAlpha * sy * cosArg;
//             height = r * cosAlpha * sy * cosArg - sinAlpha * sx * sinArg;
//         }
//         vec.x += mag * this.params.directionVector.x;
//         vec.y += depth < 0.1 ? 0.1 : height;
//         vec.z += mag * this.params.directionVector.z;

//     }

//     toLocal(x, z) {
//         let cos = this.params.directionVector.x, sin = this.params.directionVector.z;
//         let xt = x - this.params.xCenter;
//         let zt = z - this.params.zCenter;
//         let u = - xt * cos - zt * sin;
//         let v = xt * sin - zt * cos;
//         return [u, v];
//     }

//     toWorld(u, v) {
//         let cos = this.params.directionVector.x, sin = this.params.directionVector.z;
//         let x = u * cos + v * sin + this.params.xCenter;
//         let z = u * sin - v * cos + this.params.zCenter;
//         return [x, z];
//     }

//     contains(x, z) {
//         let [u, v] = this.toLocal(x, z);
//         return Math.abs(u) < this.params.trainWidth / 2 && Math.abs(v) < this.params.trainHeight / 2;
//     }

//     envelope(x, z) {
//         let xf = Math.floor(x + this.params.trainWidth / 2), zf = Math.floor(z + this.params.trainHeight);
//         let hole = 1;
//         if (this.holes[xf] && this.holes[xf][zf]) {
//             hole = this.holes[xf][zf];
//         }
//         return this.sceneParams.waveHeightScaling * this.params.amplitude * this.xAmp(x) * this.zAmp(z) * hole;
//     }

//     gaussian(x, z, x_0, z_0) {
//         let f = (a, a_0) => {
//             return (a - a_0) * (a - a_0) / (2 * this.params.wavelength);
//         }
//         return Math.exp(-(f(x, x_0) + f(z, z_0)));
//     }

//     zAmp(z) {
//         let h = this.params.trainHeight / 4;
//         const beta = -5 * Math.LN2 / h;
//         return Math.min(1, Math.exp(beta * (Math.abs(z) - h)));
//     }

//     xAmp(x) {
//         let noise = Perlin.noise(x + this.params.xCenter, x + this.params.xCenter, x + this.params.xCenter, this.params.heightFreq * this.scene.state.windSpeed / 20 || this.sceneParams.waveHeightFreq) / 4;
//         let w = this.params.trainWidth / 4;
//         const beta = -5 * Math.LN2 / w;
//         return noise * Math.min(1, Math.exp(beta * (Math.abs(x) - w)));
//     }

//     // Return true if we have exceeded the water bounds
//     translate(x, z) {
//         this.params.xCenter += x;
//         this.params.zCenter += z;
//         // if (this.params.xCenter > this.params.trainWidth / 2) {
//         //     this.params.xCenter -= this.params.trainWidth;
//         // }
//         // if (this.params.zCenter > this.params.trainHeight / 2) {
//         //     this.params.zCenter -= this.params.trainHeight;
//         // }
//         // this.ah.position.set(this.params.xCenter, 5, this.params.zCenter);
//         return Math.abs(this.params.xCenter) + this.params.trainWidth / 2 > this.sceneParams.width / 2
//             || Math.abs(this.params.zCenter) + this.params.trainHeight > this.sceneParams.height / 2;
//     }

//     update(deltaT, WA) {
//         this.deltaT = deltaT * this.scene.state.windSpeed;
//         this.time += this.deltaT;

//         this.params.steepness = this.sceneParams.steepness / WA;
//         this.params.directionVector.set(Math.cos(this.params.direction), 0, Math.sin(this.params.direction));
//         this.params.kappaInf = 2 / 3 * this.sceneParams.g / (this.scene.state.windSpeed * this.scene.state.windSpeed);
//         this.params.freq = Math.sqrt(this.sceneParams.g * this.params.kappaInf);
//         this.params.speed = this.params.freq * this.params.wavelength / (2 * Math.PI);
//         if (!this.params.fixed) {
//             this.params.wavelength = 2 * Math.PI / this.params.kappaInf;
//             this.params.amplitude = this.sceneParams.medianAmplitude / this.sceneParams.medianWavelength * this.params.wavelength;
//             for (let v = 0; v < this.params.trainHeight / this.gridSize; v++) {
//                 for (let u = 0; u < this.params.trainWidth / this.gridSize; u++) {
//                     let depth = this.scene.chunks.getDepth(u * this.gridSize - this.params.trainWidth / 2 + this.params.xCenter, v * this.gridSize - this.params.trainHeight / 2 + this.params.zCenter);
//                     let term = this.params.kappaInf / Math.sqrt(Math.tanh(this.params.kappaInf * depth)) * this.params.speed * deltaT;
//                     this.cumDepth[v][u] *= 0.99;
//                     if (depth < 0.2 || Number.isNaN(term)) this.cumDepth[v][u] = 0;
//                     else this.cumDepth[v][u] += term;
//                 }
//             }
//             this.translate(this.params.directionVector.x * this.params.speed * this.deltaT,
//                 this.params.directionVector.z * this.params.speed * this.deltaT);
//         }
//     }
// }

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

        let params = {
            position: new THREE.Vector3(0, 0, 0),
            size: new THREE.Vector3(200, 0, 200),
            heading: this.scene.state.windHeading,
            direction: new THREE.Vector3(),
            steepness: 1
        }
        this.trains = [
            new Train(this.scene, params),
        ];

        // for (let i = 0; i < this.params.numTrains; i++) {
        //     this.generateNewTrain();
        // }

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

        // if (this.trains.length != this.params.numTrains) {
        //     for (let i = this.trains.length; i < this.params.numTrains; i++) {
        //         this.generateNewTrain(i);
        //     }
        //     for (let i = this.trains.length; i > this.params.numTrains; i--) {
        //         this.trains.pop();
        //         // this.scene.remove(train.ah);
        //     }
        // }

        this.updateTrains(deltaT);

        // TODO optimize by setting on singleton vector3
        let vec = new THREE.Vector3();
        for (let v = 0; v <= this.zSegs; v++) {
            for (let u = 0; u <= this.xSegs; u++) {
                let i = this.index(u, v);
                let x = u - this.params.width / 2,
                    z = v - this.params.height / 2;
                let y = Math.max(0, this.geometry.getAttribute('position').getY(i)) / this.params.waveHeightScaling;
                vec.set(0, 0, 0);
                for (let train of this.trains) {
                    train.getPos(x, z, y, vec);
                }
                this.geometry.attributes.position.setXYZ(i, x + vec.x, vec.y, z + vec.z);
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.geometry.computeFaceNormals();
    }

    generateNewTrain(index = -1) {
        return;
        let params = {};

        // TODO more intelligent location choice
        params.trainWidth = Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize;
        params.trainHeight = Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize;
        params.xCenter = Math.random() * (this.params.width - 2 * params.trainWidth) - this.params.width / 2 + params.trainWidth;
        params.zCenter = Math.random() * (this.params.height - 2 * params.trainHeight) - this.params.height / 2 + params.trainHeight;
        params.wavelength = this.params.medianWavelength * (Math.random() * 3 / 2 + .5) * this.scene.state.windSpeed / 20;
        params.direction = this.scene.state.windHeading;
        params.numHoles = 30;
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
        this.material.bumpMap.offset.x += 16 * x / this.params.width;
        this.material.bumpMap.offset.y += 16 * z / this.params.height;
        this.trains[0].translate(x, z);
        // for (let i = 0; i < this.trains.length; i++) {
        //     if (this.trains[i].translate(x, z)) {
        //         this.generateNewTrain(i);
        //     }
        // }
        // for (let train of this.backgroundTrains) {
        //     train.translate(x, z);
        // }
    }
}

export default Water;
