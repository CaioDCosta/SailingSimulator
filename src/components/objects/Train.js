import { ArrowHelper, Vector3 } from 'three';
import { Perlin } from 'utils';
const PoissonDiskSampling = require("poisson-disk-sampling");

class Train {

    /* Params:
     * position:                Vector3D (xCenter, 0, zCenter) in world coordinates     
     * size:                    Vector3D (trainWidth, 0, trainHeight)
     * baseWavelength:          Base wavelength for the train at 5 mps winds
     * wavelengthWindFactor:    Scaling factor for wind impact on wavelength;
     * baseHeading:             Base heading for the wave train.
     */
    constructor(scene, params) {
        this.scene = scene;
        this.sceneParams = scene.params.wave;
        this.params = params;
        // this.depths = new Array((this.params.size.x + 1) * (this.params.size.z + 1)).fill(0);
        this.holes = new Array((this.params.size.x + 1) * (this.params.size.z + 1)).fill(0);
        this.time = Math.random() * 20;
        this.params.wavelength = this.params.wavelengthWindFactor * this.scene.state.windSpeed / 5 * this.params.baseWavelength;
        this.params.freq = Math.sqrt(this.sceneParams.g / this.params.wavelength * 2 * Math.PI);
        this.params.amplitude = this.sceneParams.steepness * this.params.wavelength / (2 * Math.PI);
        this.kappaInf = this.params.freq * this.params.freq / this.sceneParams.g;
        this.params.direction = new Vector3(Math.cos(this.params.heading), 0, Math.sin(this.params.heading));
        this.params.headingOffset = 0;
        this.offset = new Vector3();
        this.initHoles();
    }

    static getParams() {

    }

    initHoles() {
        const pds = new PoissonDiskSampling({
            shape: [this.params.size.x, this.params.size.z],
            minDistance: this.params.wavelength * 1.5,
            maxDistance: this.params.wavelength * 10,
            tries: 10
        })
        const holes = pds.fill().sort(() => 0.5 - Math.random()).slice(0, this.params.numHoles).map(([x, z]) => [x - this.params.size.x / 2, z - this.params.size.z / 2]);
        const up = new Vector3(0, 1, 0);
        for (let x = -Math.ceil(this.params.size.x / 2); x <= this.params.size.x / 2; x++) {
            for (let z = -Math.ceil(this.params.size.z / 2); z <= this.params.size.z / 2; z++) {
                let hole = 0;
                for (let [x0, z0] of holes) {
                    hole += this.gaussian(x, z, x0, z0);
                }
                this.holes[this.index(x, z)] = hole;
            }
        }
    }

    // Convert from local coords to 1D index
    index(u, v) {
        return (Math.floor(u) + this.params.size.x / 2) * this.params.size.x + Math.floor(v) + this.params.size.z / 2;
    }

    toLocal(x, z) {
        let cos = this.params.direction.x,
            sin = this.params.direction.z;
        let xt = x - this.params.position.x;
        let zt = z - this.params.position.z;
        let u = - xt * cos - zt * sin;
        let v = xt * sin - zt * cos;
        return [u, v];
    }

    contains(x, z) {
        if (this.params.background) return true;
        let [u, v] = this.toLocal(x, z);
        return Math.abs(u) <= this.params.size.x / 2 && Math.abs(v) <= this.params.size.z / 2;
    }

    standardAmp(x, sizeX) {
        let h = sizeX / 4;
        const beta = -5 * Math.LN2 / h;
        return Math.min(1, Math.exp(beta * (Math.abs(x) - h)));
    }

    noiseAmp(x, sizeX) {
        let noise = Perlin.noise(x, 1.24, 2.415,
            this.params.heightFreq || this.sceneParams.waveHeightPerlinFreq) + 1;
        let w = sizeX / 4;
        const beta = -5 * Math.LN2 / w;
        return (1 + this.sceneParams.waveHeightPerlinAmplitude * noise) * Math.min(1, Math.exp(beta * (Math.abs(x) - w)));
    }

    calcHoles(r, u, v) {
        let hole = this.holes[this.index(u, v)];
        return hole === undefined ? r : Math.max(0, Math.min(1, r - (this.params.holiness || this.sceneParams.holiness) * hole));
    }

    envelope(u, v) {
        return Math.max(0, Math.min(1, (this.sceneParams.usePerlinNoiseInHeight ? this.noiseAmp(u, this.params.size.x) : this.standardAmp(u, this.params.size.x))
            * this.standardAmp(v, 0.75 * this.params.size.z)));
    }

    getPosBackground(x, z, y, vec, totalSteepness) {
        const mod = (a, m) => ((a % m) + m) % m;
        const [u, v] = this.toLocal(mod(x + this.params.size.x / 2 - this.offset.x, this.params.size.x) - this.params.size.x / 2,
            mod(z + this.params.size.z / 2 - this.offset.z, this.params.size.z) - this.params.size.z / 2);
        const r = this.calcHoles(this.envelope(x, z), u, v) * this.params.amplitude / totalSteepness;
        if (Math.abs(r) < 0.01) return;

        const depth = this.scene.chunks.getDepth(x, z);
        if (depth < 0) return;

        const phi = this.kappaInf * u - this.params.freq * this.time - this.sceneParams.lambda * y * this.deltaT;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const slope = this.scene.chunks.getSlope(x, z, this.params.direction);
        const alpha = Math.max(0, Math.min(1, slope * Math.exp(-depth * this.sceneParams.kappa0)));
        const sinAlpha = Math.sin(alpha);
        const cosAlpha = Math.cos(alpha);
        const sx = Math.max(0, Math.min(1, 1 / (1 - Math.exp(-depth * this.sceneParams.kappaX))));
        const sy = Math.max(0, Math.min(1, sx * (1 - Math.exp(-depth * this.sceneParams.kappaY))));

        const forward = r * cosAlpha * sx * sinPhi + sinAlpha * sy * cosPhi;
        const up = r * cosAlpha * sy * cosPhi - sinAlpha * sx * sinPhi;
        // const forward = r * sinPhi;
        // const up = r * cosPhi;   
        vec.x += forward * this.params.direction.x;
        vec.y += up;
        vec.z += forward * this.params.direction.z;
    }

    getPos(x, z, y, vec, totalSteepness) {
        if (this.params.background) {
            this.getPosBackground(x, z, y, vec, totalSteepness);
            return;
        }
        const [u, v] = this.toLocal(x + this.offset.x, z + this.offset.z);
        if (Math.abs(u) > this.params.size.x / 2 || Math.abs(v) > this.params.size.z / 2) return;
        const r = this.calcHoles(this.envelope(u, v), u, v) * this.params.amplitude / totalSteepness;
        // vec.y += r;
        // return;
        if (Math.abs(r) < 0.01) return;

        const depth = this.scene.chunks.getDepth(x, z);
        if (depth < 0) return;

        // const i = this.index(u, v);
        // this.depths[i] *= 0.95;
        // this.depths[i] += this.kappaInf * (-1 + 1 / Math.sqrt(Math.tanh(this.kappaInf * depth * this.sceneParams.depthDecay)))
        //     * this.scene.state.windSpeed * this.scene.state.windDirection.dot(this.params.direction) * this.deltaT;

        const phi = this.kappaInf * u - this.params.freq * this.time - this.sceneParams.lambda * y * this.deltaT;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const slope = this.scene.chunks.getSlope(x, z, this.params.direction);
        const alpha = Math.max(0, Math.min(1, slope * Math.exp(-depth * this.sceneParams.kappa0)));
        const sinAlpha = Math.sin(alpha);
        const cosAlpha = Math.cos(alpha);
        const sx = Math.max(0, Math.min(1, 1 / (1 - Math.exp(-depth * this.sceneParams.kappaX))));
        const sy = Math.max(0, Math.min(1, sx * (1 - Math.exp(-depth * this.sceneParams.kappaY))));

        const forward = r * cosAlpha * sx * sinPhi + sinAlpha * sy * cosPhi;
        const up = r * cosAlpha * sy * cosPhi - sinAlpha * sx * sinPhi;
        // const forward = r * sinPhi;
        // const up = r * cosPhi;   
        vec.x += forward * this.params.direction.x;
        vec.y += up;
        vec.z += forward * this.params.direction.z;
    }

    gaussian(x, z, x_0, z_0) {
        let f = (a, a_0) => {
            return (a - a_0) * (a - a_0) / (2 * this.params.wavelength);
        }
        return Math.exp(-(f(x, x_0) + f(z, z_0)));
    }

    translate(x, z) {
        this.offset.x += x;
        this.offset.z += z;
    }

    update(deltaT, deltaHeading) {
        this.deltaT = deltaT * this.scene.state.windSpeed / 20 * this.sceneParams.waveSpeedFactor;
        this.time += this.deltaT;
        this.params.wavelength = this.params.wavelengthWindFactor * this.scene.state.windSpeed / 5 * this.params.baseWavelength;
        this.params.freq = Math.sqrt(this.sceneParams.g / this.params.wavelength * (2 * Math.PI));
        this.params.amplitude = this.sceneParams.steepnessMultiplier * this.params.steepness * this.params.wavelength / (2 * Math.PI);
        this.kappaInf = this.params.freq * this.params.freq / this.sceneParams.g;
        this.params.headingOffset += deltaHeading;
        const heading = this.params.baseHeading + this.params.headingOffset;
        this.params.direction.set(Math.cos(heading), 0, Math.sin(heading));
        // this.params.speed = Math.sqrt(this.params.g * this.params.wavelength / (2 * Math.PI))
        if (!this.params.background) {
            const speed = this.params.freq * this.params.wavelength;
            this.params.position.x += speed * deltaT * this.params.direction.x;
            this.params.position.z += speed * deltaT * this.params.direction.z;
        }
    }
}

export default Train;