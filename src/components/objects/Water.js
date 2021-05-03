import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { Perlin } from 'utils';
class Train {
    constructor(scene, xCenter = 0, zCenter = 0, trainWidth = 50, trainHeight = 50, direction = 0) {
        this.params = scene.params.wave;
        this.amplitude = (u, v) => this.noiseAmp(u, v) * this.standardAmp(v);
        this.xCenter = xCenter;
        this.zCenter = zCenter;
        this.trainWidth = trainWidth;
        this.trainHeight = trainHeight;
        this.direction = direction;
        this.directionVector = new THREE.Vector3(Math.cos(direction), 0, Math.sin(direction));
        this.speed = 0;
        this.depth = 0;
        this.scene = scene;
        this.ah = new THREE.ArrowHelper(this.directionVector, new THREE.Vector3(this.xCenter, 2, this.zCenter), 10);
        this.scene.add(this.ah);
        this.id = this.params.id++;
    }

    getPos(x, z, y, time, deltaT, vec) {
        let [u, v] = this.toLocal(x, z);
        let r = this.amplitude(u, v);
        if (r < Number.EPSILON || this.omega < Number.EPSILON) return;
        let phi = this.kappa * u - this.omega * time - this.scene.params.wave.lambda * y * deltaT;
        let [newX, newZ] = this.toWorld(u + r * Math.sin(phi), v);
        vec.x += newX - x;
        vec.y -= r * Math.cos(phi)
        vec.z += newZ - z;
    }

    toLocal(x, z) {
        let xt = x - this.xCenter;
        let zt = z - this.zCenter;
        let u = this.directionVector.x * xt + this.directionVector.z * zt;
        let v = this.directionVector.z * xt - this.directionVector.x * zt;
        return [u, v];

    }

    toWorld(u, v) {
        let x = this.directionVector.x * u + this.directionVector.z * v + this.xCenter;
        let z = this.directionVector.z * u - this.directionVector.x * v + this.zCenter;
        return [x, z];
    }

    contains(x, z) {
        let [u, v] = this.toLocal(x, z);
        return Math.abs(u) < this.trainWidth / 2 && Math.abs(v) < this.trainHeight / 2;
    }

    standardAmp(x) {
        const params = this.params;
        return Math.max(0, params.h * Math.min(Math.max(0, Math.min(1, params.s)), 1 - x * x / (params.w * params.w)));
    }

    noiseAmp(x, s) {
        let seed = x * s * this.id / this.trainWidth;
        let p = (Perlin.noise(seed, seed, seed, this.params.freq) + 2) / 2;
        return this.standardAmp(x) * p;
    }

    // Return true if we have exceeded the water bounds
    translate(x, z) {
        this.xCenter += x;
        this.zCenter += z;
        this.ah.position.set(this.xCenter, 0, this.zCenter);
        return Math.abs(this.xCenter) > this.params.width / 2 || Math.abs(this.zCenter) > this.params.height / 2;
    }

    update() {
        let V = this.scene.state.windSpeed;
        if (V < Number.EPSILON) {
            this.omega = -1;
            return;
        }
        this.omega = this.params.g / V * Math.sqrt(2 / 3);
        this.T = 2 * Math.PI / this.omega;
        this.L = this.params.g * this.T * this.T / (2 * Math.PI);
        this.speed = this.L / this.T / 2;
        this.kappa = (2 * Math.PI) / this.L;
        this.ah.setDirection(this.directionVector);
        this.direction = this.scene.state.windHeading;
        this.directionVector.set(Math.cos(this.direction), 0, Math.sin(this.direction));
        this.ah.setDirection(this.directionVector);
        // this.translate(Math.cos(this.direction) * this.speed / 10, Math.sin(this.direction) * this.speed / 10);
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

        let width = this.params.width, height = this.params.height;
        this.geometry = new THREE.PlaneBufferGeometry(width, height, width, height);
        this.material = new THREE.MeshStandardMaterial({ color: 0x0010ff, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.trains = [];
        for (let i = 0; i < this.params.numTrains; i++) {
            this.generateNewTrain();
        }

        for (let u = 0; u <= width; u++) {
            for (let v = 0; v <= height; v++) {
                let i = this.index(u, v);
                this.geometry.attributes.position.setXYZ(i, u - width / 2, 0, v - height / 2);
            }
        }
        this.add(this.mesh);
        this.scene.addToUpdateList(this);
    }

    index(u, v) { return u * (this.params.width + 1) + v; }

    updateTrains() {
        for (let train of this.trains) {
            train.update();
        }
    }

    update(deltaT) {
        let w = this.params.width, h = this.params.height;
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
        for (let u = 0; u <= w; u += 1) {
            for (let v = 0; v <= h; v += 1) {
                let i = this.index(u, v);
                let x = u - this.params.width / 2;
                let z = v - this.params.height / 2;
                vec.set(0, 0, 0);
                for (let train of this.trains) {
                    if (train.contains(x, z)) {
                        train.getPos(x, z, this.geometry.attributes.position.getY(i), this.time, deltaT, vec);
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
        let dir = Math.random() * Math.PI * 2;

        let train = new Train(this.scene, xCenter, zCenter, sizeX, sizeZ, dir);
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
