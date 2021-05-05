import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { Perlin } from 'utils';
class Train {
    constructor(scene, xCenter = 0, zCenter = 0, trainWidth = 50, trainHeight = 50, direction = 0, wavelength = 0, amplitude = undefined, fixed = false) {
        this.params = scene.params.wave;
        this.amplitudeFunction = (u, v) => this.noiseAmp(u, v) * this.standardAmp(v);
        this.xCenter = xCenter;
        this.zCenter = zCenter;
        this.trainWidth = trainWidth;
        this.trainHeight = trainHeight;
        this.direction = direction;
        this.scene = scene;
        this.directionVector = new THREE.Vector3(Math.cos(direction), 0, Math.sin(direction));

        this.ah = new THREE.ArrowHelper(this.directionVector, new THREE.Vector3(this.xCenter, 5, this.zCenter), 10);
        this.scene.add(this.ah);
        this.id = this.params.id++;

        this.fixed = fixed;

        this.depth = this.scene.params.chunk.seafloor.depth;
        this.cumDepth = 0;

        this.wavelength = wavelength;
        this.amplitude = amplitude || this.params.medianAmplitude / this.params.medianWavelength * this.wavelength;
        this.kappa = Math.PI * 2 / this.wavelength;
    }

    getPos(x, z, time, vec) {
        let r = this.amplitude * this.amplitudeFunction(...this.toLocal(x, z));
        let arg = this.directionVector.x * this.freq * x + this.directionVector.z * this.freq * z + this.phi * time;
        let mag = this.steepness * r * Math.cos(arg);
        let height = r * Math.sin(arg);
        vec.x += mag * this.directionVector.x;
        vec.y += height;
        vec.z += mag * this.directionVector.z;
    }

    toLocal(x, z) {
        let xt = x - this.xCenter;
        let zt = z - this.zCenter;
        let u = xt * this.directionVector.x + zt * this.directionVector.z;
        let v = xt * this.directionVector.z - zt * this.directionVector.x;
        return [u, v];
    }

    toWorld(u, v) {
        let x = u * this.directionVector.x + v * this.directionVector.z + this.xCenter;
        let z = u * this.directionVector.z - v * this.directionVector.x + this.zCenter;
        return [x, z];
    }

    contains(x, z) {
        let [u, v] = this.toLocal(x, z);
        return Math.abs(u) < this.trainWidth / 2 && Math.abs(v) < this.trainHeight / 2;
    }

    standardAmp(x) {
        const params = this.params;
        let s = Math.max(0, Math.min(1, params.s));
        return Math.max(0, Math.min(s, 1 - x * x / (params.w * params.w)));
    }

    noiseAmp(x, z) {
        let [u, v] = this.toLocal(x, z);
        let p = (Perlin.noise(v, u, 1.234, this.params.freq) + 2) / 2;
        return this.standardAmp(x) * p;
    }

    // Return true if we have exceeded the water bounds
    translate(x, z) {
        if (this.fixed) return;
        this.xCenter += x;
        this.zCenter += z;
        this.ah.position.set(this.xCenter, 5, this.zCenter);
        return Math.abs(this.xCenter) + this.sizeX / 2 > this.params.width / 2
            || Math.abs(this.zCenter) + this.sizeZ > this.params.height / 2;
    }

    update() {
        this.direction = this.scene.state.windHeading;
        this.directionVector.set(Math.cos(this.direction), 0, Math.sin(this.direction));

        this.depth = Perlin.lerp(0.5, this.depth, this.scene.chunks.getDepth(this.xCenter, this.zCenter));
        this.freq = Math.sqrt(this.params.g * this.kappa * Math.tanh(this.kappa * this.depth));
        this.speed = this.freq * this.wavelength;
        this.steepness = this.params.steepness / (this.amplitude * this.freq);
        this.phi = this.speed * 2 / this.wavelength;

        // this.cumDepth += (this.kappa - this.kappaInf) * this.groupVelocity / 10;
        // this.gamma = Perlin.lerp(0.5, this.gamma, this.scene.chunks.getSlope(this.xCenter, this.zCenter, this.directionVector));
        // let alpha = this.gamma * Math.exp(-this.params.kappa0 * this.depth);
        // this.cosAlpha = Math.cos(alpha);
        // this.sinAlpha = Math.sin(alpha);
        // this.sX = 1 / (1 - Math.exp(-this.params.kappaX * this.depth));
        // this.sY = this.sX * (1 - Math.exp(-this.params.kappaY * this.depth));

        this.ah.setDirection(this.directionVector);
        this.translate(this.directionVector.x * this.speed / 100, this.directionVector.z * this.speed / 100);
    }
}

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
        this.segsPerUnit = 2;
        let width = this.params.width, height = this.params.height;
        this.xSegs = this.params.width * this.segsPerUnit;
        this.zSegs = this.params.height * this.segsPerUnit;
        this.geometry = new THREE.PlaneBufferGeometry(width, height, this.xSegs, this.zSegs);
        this.material = new THREE.MeshStandardMaterial({ color: 0x0010ff, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.trains = [];
        this.backgroundTrains = [
            new Train(this.scene, 0, 0, width / 2, height / 2, this.scene.state.windHeading, 10, .5, true)
        ];

        for (let i = 0; i < this.params.numTrains; i++) {
            this.generateNewTrain();
        }

        this.add(this.mesh);
        this.scene.addToUpdateList(this);
    }

    index(u, v) { return u * (this.xSegs + 1) + v; }

    updateTrains() {
        for (let train of this.trains) {
            train.update();
        }
        for (let train of this.backgroundTrains) {
            train.update();
        }
    }

    getRestingPosFromIndex(u, v) {
        let x = u / this.segsPerUnit - this.params.width / 2;
        let z = v / this.segsPerUnit - this.params.height / 2;
        return [x, z];
    }

    update(deltaT) {
        this.time += deltaT;

        if (this.trains.length != this.params.numTrains) {
            for (let i = this.trains.length; i < this.params.numTrains; i++) {
                this.generateNewTrain(i);
            }
            for (let i = this.trains.length; i > this.params.numTrains; i--) {
                let train = this.trains.pop();
                this.scene.remove(train.ah);
            }
        }

        this.updateTrains();

        // TODO optimize by setting on singleton vector3
        let vec = new THREE.Vector3();
        for (let u = 0; u <= this.xSegs; u += 1) {
            for (let v = 0; v <= this.zSegs; v += 1) {
                let i = this.index(u, v);
                let [x, z] = this.getRestingPosFromIndex(u, v);
                vec.set(0, 0, 0);
                for (let train of this.backgroundTrains) {
                    train.getPos(x, z, this.time, vec);
                }
                for (let train of this.trains) {
                    if (train.contains(x, z)) {
                        train.getPos(x, z, this.time, vec);
                    }
                }
                this.geometry.attributes.position.setXYZ(i, x + vec.x, vec.y, z + vec.z);
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    generateNewTrain(index = -1) {
        let sizeX = Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize;
        let sizeZ = Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize;
        let xCenter = Math.random() * (this.params.width - 2 * sizeX) - this.params.width / 2 + sizeX;
        let zCenter = Math.random() * (this.params.height - 2 * sizeZ) - this.params.height / 2 + sizeZ;
        let wavelength = this.params.medianWavelength * (Math.random() * 3 / 2 + .5);
        let train = new Train(this.scene, xCenter, zCenter, sizeX, sizeZ, this.scene.state.windHeading, wavelength);
        if (index < 0 || index >= this.trains.length) {
            this.trains.push(train);
        } else {
            this.trains[index] = train;
        }
    }

    translate(x, z) {
        for (let i = 0; i < this.trains.length; i++) {
            if (this.trains[i].translate(x, z)) {
                generateNewTrain(i);
            }
        }
    }
}

export default Water;
