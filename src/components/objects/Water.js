import * as THREE from 'three';

class Water extends THREE.Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.width = 201;
        this.height = 201;

        let g = 10;
        this.scene = parent;
        this.previousTimeStamp = 0;
        this.lambda = 2;
        this.plane = (u, v, vec, deltaT) => {
            if (!vec) return;
            let t = this.previousTimeStamp;
            let x_0 = u * this.width * this.separation - this.width * this.separation / 2;
            let z_0 = v * this.height * this.separation - this.height * this.separation / 2;
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
            let phi = kappa * x_0 - omega * t - this.lambda * vec.y * deltaT;
            vec.set(x_0 + r * Math.sin(phi), -r * Math.cos(phi), z_0);
        }

        this.separation = 5;
        this.geometry = new THREE.PlaneBufferGeometry((this.width - 1) * this.separation, (this.height - 1) * this.separation, this.width - 1, this.height - 1);
        this.material = new THREE.MeshStandardMaterial({ color: 0x0010ff, side: THREE.DoubleSide });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }
    update(timeStamp) {
        let index = (u, v) => u * this.width + v;
        timeStamp /= 10000;
        let deltaT = timeStamp - this.previousTimeStamp;
        this.previousTimeStamp = timeStamp;
        let vec = new THREE.Vector3();
        for (let u = 0; u < this.width; u += 1) {
            for (let v = 0; v < this.height; v += 1) {
                let i = index(u, v);
                vec.y = this.geometry.attributes.position.getY(i);
                this.plane(u / this.width, v / this.height, vec, deltaT);
                this.geometry.attributes.position.setXYZ(i, ...vec.toArray());
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
}

export default Water;
