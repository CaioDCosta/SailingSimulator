import * as THREE from 'three';

class Water extends THREE.Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.params = parent.params;

        this.scene = parent.scene;
        this.previousTimeStamp = 0;
        this.geometry = new THREE.PlaneBufferGeometry(this.params.width * this.params.scale,
            this.params.height * this.params.scale, this.params.width - 1, this.params.height - 1);
        this.material = new THREE.MeshStandardMaterial({ color: 0x0010ff, side: THREE.DoubleSide });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }

    uvToXZ(u, v) {
        return [(u - this.params.width / 2) * this.params.scale, (v - this.params.height / 2) * this.params.scale];
    }

    wave(u, v, vec, deltaT) {
        if (!vec) return;

        let t = this.previousTimeStamp;
        let g = this.params.wave.g;
        let [x_0, z_0] = this.uvToXZ(u, v);

        let V = this.scene.state.windSpeed / 2;
        if (V < Number.EPSILON) {
            vec.set(x_0, 0, z_0);
            return;
        }

        let omega = g / V * Math.sqrt(2 / 3);
        let H = 7.065 * 10e-3 * Math.pow(V, 2.5);
        let r = H / 2;
        let T = 2 * Math.PI / omega;
        let L = g * T * T / (2 * Math.PI);
        let kappa = (2 * Math.PI) / L;
        let phi = kappa * x_0 - omega * t - this.params.wave.lambda * vec.y * deltaT;

        vec.set(x_0 + r * Math.sin(phi), -r * Math.cos(phi), z_0);
    }

    update(timeStamp) {

        let w = this.params.width, h = this.params.height;
        let index = (u, v) => u * w + v;

        timeStamp /= 1000;
        let deltaT = timeStamp - this.previousTimeStamp;
        this.previousTimeStamp = timeStamp;

        let vec = new THREE.Vector3();
        for (let u = 0; u < w; u += 1) {
            for (let v = 0; v < h; v += 1) {
                let i = index(u, v);
                vec.y = this.geometry.attributes.position.getY(i);
                this.wave(u, v, vec, deltaT);
                this.geometry.attributes.position.setXYZ(i, ...vec.toArray());
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
}

export default Water;
