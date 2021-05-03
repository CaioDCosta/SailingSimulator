import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { Perlin } from 'utils';
class Train {
    constructor(scene, xCenter = 0, zCenter = 0, sizeX = 50, sizeZ = 50, direction = 0, speed = 0) {
        this.params = scene.params.wave;
        this.amplitude = (x, z) => this.noiseAmp(x) * this.standardAmp(z);
        // Store coords as south west coord
        this.xCenter = xCenter;
        this.zCenter = zCenter;
        this.sizeX = sizeX;
        this.sizeZ = sizeZ;
        this.direction = direction;
        this.speed = speed;
        this.depth = 0;
        this.scene = scene;
    }

    getPos(x, z, y, time, deltaT, vec) {
        let g = this.params.g;
        let V = this.scene.state.windSpeed;
        if (V < Number.EPSILON) {
            return;
        }

        let omega = g / V * Math.sqrt(2 / 3);
        let r = this.amplitude(x, z);
        let T = 2 * Math.PI / omega;
        let L = g * T * T / (2 * Math.PI);
        let kappa = (2 * Math.PI) / L;
        let phi = kappa * x - omega * time - this.params.lambda * y * deltaT;

        vec.x += r * Math.sin(phi);
        vec.y -= r * Math.cos(phi)
    }

    contains(x, z) {
        return Math.abs(x - this.xCenter) < this.sizeX / 2 && Math.abs(z - this.zCenter) < this.sizeZ / 2;
    }

    standardAmp(x) {
        const params = this.params;
        return Math.max(0, params.h * Math.min(Math.max(0, Math.min(1, params.s)), 1 - x * x / (params.w * params.w)));
    }

    noiseAmp(x) {
        let time = this.scene.state.time;
        return this.standardAmp(x) * Perlin.noise(time, time, time, this.params.freq);
    }
}

class Water extends THREE.Group {
    constructor(scene) {
        // Call parent Group() constructor
        super();

        this.params = scene.params.wave;
        this.time = 0;
        this.scene = scene;
        this.previousTimeStamp = 0;

        let width = this.params.width, height = this.params.height;
        this.geometry = new THREE.PlaneBufferGeometry(width, height, width, height);
        this.material = new THREE.MeshStandardMaterial({ color: 0x0010ff, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.tween = new TWEEN.Tween(this.position);

        this.trains = [];
        for (let i = 0; i < this.params.numTrains; i++) {
            this.trains.push(new Train(this.scene, 0, 0));
        }

        for (let u = 0; u <= width; u++) {
            for (let v = 0; v <= height; v++) {
                let i = this.index(u, v);
                this.geometry.attributes.position.setXYZ(i, u - width / 2, 0, v - height / 2);
            }
        }
        this.add(this.mesh);
        this.scene.addToUpdateList(this);
        // this.update(0);
    }

    index(u, v) { return u * (this.params.width + 1) + v; }

    update(deltaT) {
        let w = this.params.width, h = this.params.height;
        this.time += deltaT;

        // TODO optimize by setting on singleton vector3
        let vec = new THREE.Vector3();
        for (let u = 0; u <= w; u += 1) {
            for (let v = 0; v <= h; v += 1) {
                let i = this.index(u, v);
                let x = u - this.params.width / 2 + this.position.x;
                let z = v - this.params.height / 2 + this.position.y;
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

    translate(x, z) {
        let width = this.params.width, height = this.params.height;
        if (this.position.x + x > width / 2) {
            this.position.x -= width;
        }
        else if (this.position.x + x < -width / 2) {
            this.position.x += width;
        }
        if (this.position.z + z > height / 2) {
            this.position.z -= height;
        }
        else if (this.position.z + z < -height / 2) {
            this.position.z += height;
        }
        this.tween.to({ x: this.position.x + x, z: this.position.z + z }, this.scene.params.interval).start(this.time);
    }
}

export default Water;
