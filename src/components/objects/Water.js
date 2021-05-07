import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { Perlin } from 'utils';
class Train {
    constructor(scene, params) {
        this.timeOffset = Math.random() * 20;
        this.scene = scene;
        this.params = params;
        this.sceneParams = this.scene.params.wave;
        if (!this.params.amplitude) this.params.amplitude = this.sceneParams.medianWavelength / this.sceneParams.medianAmplitude * this.params.wavelength;
        this.params.directionVector = new THREE.Vector3(Math.cos(params.direction), 0, Math.sin(params.direction));
        this.depth = this.scene.params.chunk.seafloor.depth;
        this.cumDepth = 0;
        this.params.kappa = Math.PI * 2 / this.params.wavelength;

        // this.ah = new THREE.ArrowHelper(this.directionVector, new THREE.Vector3(this.xCenter, 5, this.zCenter), 10);
        // this.scene.add(this.ah);

    }

    getPos(x, z, time, vec) {
        let r = this.envelope(...this.toLocal(x, z));
        if (Math.abs(r) < 0.05) return;
        let arg = this.params.directionVector.x * this.params.freq * x
            + this.params.directionVector.z * this.params.freq * z
            + this.params.phi * (time + this.timeOffset);
        let mag = this.params.steepness * r * Math.cos(arg);
        let height = r * Math.sin(arg);
        vec.x += mag * this.params.directionVector.x;
        vec.y += height;
        vec.z += mag * this.params.directionVector.z;
    }

    toLocal(x, z) {
        let cos = this.params.directionVector.x, sin = this.params.directionVector.z;
        let xt = x - this.params.xCenter;
        let zt = z - this.params.zCenter;
        let u = xt * cos + zt * sin;
        let v = xt * sin - zt * cos;
        return [u, v];
    }

    toWorld(u, v) {
        let cos = this.params.directionVector.x, sin = this.params.directionVector.z;
        let x = u * cos + v * sin + this.params.xCenter;
        let z = u * sin - v * cos + this.params.zCenter;
        return [x, z];
    }

    contains(x, z) {
        let [u, v] = this.toLocal(x, z);
        return Math.abs(u) < this.params.trainWidth / 2 && Math.abs(v) < this.params.trainHeight / 2;
    }

    envelope(x, z) {
        return this.sceneParams.waveHeightScaling * this.params.amplitude * this.xAmp(x) * this.zAmp(z);
    }

    zAmp(z) {
        let h = this.params.trainHeight / 2;
        if (Math.abs(z) > h) return 0;
        return 1 - Math.exp(Math.abs(z) - h);
    }

    xAmp(x) {
        let noise = Perlin.noise(x, x, x, this.sceneParams.waveHeightFreq) / 2;
        let w = this.params.trainWidth / 2;
        if (Math.abs(x) > w) return 0;
        return noise * (1 - Math.exp(Math.abs(x) - w));
    }

    // Return true if we have exceeded the water bounds
    translate(x, z) {
        this.params.xCenter += x;
        this.params.zCenter += z;
        if (this.params.fixed) {
            this.params.xCenter %= this.params.trainWidth;
            this.params.zCenter %= this.params.trainHeight;
        };
        // this.ah.position.set(this.params.xCenter, 5, this.params.zCenter);
        return Math.abs(this.params.xCenter) + this.params.sizeX / 2 > this.params.trainWidth / 2
            || Math.abs(this.params.zCenter) + this.params.sizeZ > this.params.trainHeight / 2;
    }

    update() {
        this.depth = Perlin.lerp(0.5, this.depth, this.scene.chunks.getDepth(this.params.xCenter, this.params.zCenter));
        this.params.freq = Math.sqrt(this.sceneParams.g * this.params.kappa * Math.tanh(this.params.kappa * this.depth));
        this.params.speed = this.params.freq * this.params.wavelength;
        this.params.steepness = this.sceneParams.steepness / (this.params.amplitude * this.params.freq);
        this.params.phi = this.params.speed * 2 / this.params.wavelength;

        // this.cumDepth += (this.kappa - this.kappaInf) * this.groupVelocity / 10;
        // this.gamma = Perlin.lerp(0.5, this.gamma, this.scene.chunks.getSlope(this.xCenter, this.zCenter, this.directionVector));
        // let alpha = this.gamma * Math.exp(-this.params.kappa0 * this.depth);
        // this.cosAlpha = Math.cos(alpha);
        // this.sinAlpha = Math.sin(alpha);
        // this.sX = 1 / (1 - Math.exp(-this.params.kappaX * this.depth));
        // this.sY = this.sX * (1 - Math.exp(-this.params.kappaY * this.depth));
        if (!this.params.fixed) {
            this.translate(this.params.directionVector.x * this.params.speed / 20,
                this.params.directionVector.z * this.params.speed / 20);
        }
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
        this.segsPerUnit = 1;
        let width = this.params.width, height = this.params.height;
        this.xSegs = this.params.width * this.segsPerUnit;
        this.zSegs = this.params.height * this.segsPerUnit;
        this.geometry = new THREE.PlaneBufferGeometry(width, height, this.xSegs, this.zSegs);
        const bumpTexture = new THREE.TextureLoader().load("/src/components/objects/res/water_normals.png")
        bumpTexture.repeat = new THREE.Vector2(16, 16);
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

        const colors = new Uint8Array(5);
        for (let c = 0; c <= colors.length; c++) {
            colors[c] = (c / colors.length) * 256;
        }

        const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.LuminanceFormat);
        gradientMap.minFilter = THREE.NearestFilter;
        gradientMap.magFilter = THREE.NearestFilter;
        gradientMap.generateMipmaps = false;
        // this.material = new THREE.MeshToonMaterial({ color: 0x0010ff, side: THREE.FrontSide, bumpMap: bumpTexture, gradientMap: gradientMap });

        this.material = new THREE.MeshPhysicalMaterial({ color: 0x0010ff, side: THREE.FrontSide, bumpMap: bumpTexture, transparent: true });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.trains = [];
        let params1 = {
            xCenter: 0,
            zCenter: 0,
            fixed: true,
            trainWidth: width,
            trainHeight: height,
            direction: this.scene.state.windHeading + Math.PI / 8,
            wavelength: 5,
            amplitude: 1
        }
        let params2 = {
            xCenter: 0,
            zCenter: 0,
            fixed: true,
            trainWidth: width,
            trainHeight: height,
            direction: this.scene.state.windHeading - Math.PI / 8,
            wavelength: 5,
            amplitude: 1
        }
        let params3 = {
            xCenter: 0,
            zCenter: 0,
            fixed: true,
            trainWidth: width,
            trainHeight: height,
            direction: this.scene.state.windHeading,
            wavelength: 10,
            amplitude: 2
        }
        this.backgroundTrains = [
            new Train(this.scene, params1),
            new Train(this.scene, params2),
            new Train(this.scene, params3)
        ];

        for (let i = 0; i < this.params.numTrains; i++) {
            this.generateNewTrain();
        }

        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;

        this.add(this.mesh);
        this.scene.addToUpdateList(this);
    }

    index(u, v) { return v * (this.zSegs + 1) + u; }

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
                // this.geometry.attributes.position.setXYZ(i, x, 0, z);
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    generateNewTrain(index = -1) {
        let params = {};

        // TODO more intelligent location choice
        params.trainWidth = Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize;
        params.trainHeight = Math.random() * (this.params.maxSize - this.params.minSize) + this.params.minSize;
        params.xCenter = Math.random() * (this.params.width - 2 * params.trainWidth) - this.params.width / 2 + params.trainWidth;
        params.zCenter = Math.random() * (this.params.height - 2 * params.trainHeight) - this.params.height / 2 + params.trainHeight;
        params.wavelength = this.params.medianWavelength * (Math.random() * 3 / 2 + .5) * this.scene.state.windSpeed;
        params.direction = this.scene.state.windHeading;

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
        for (let i = 0; i < this.trains.length; i++) {
            if (this.trains[i].translate(x, z)) {
                generateNewTrain(i);
            }
        }
        for (let train of this.backgroundTrains) {
            // train.translate(x, z);
        }
    }
}

export default Water;
