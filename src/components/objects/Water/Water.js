import * as THREE from 'three';

class Water extends THREE.Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.width = 401;
        this.height = 401;

        let size = this.width * this.height;

        let g = 10;
        let yAxis = new THREE.Vector3(0, 1, 0);
        this.scene = parent;
        this.previousTimeStamp = 0;
        this.lambda = 0.1;
        this.plane = (u, v, y, deltaT) => {
            let t = this.previousTimeStamp % (4 * Math.PI);
            let x_0 = u * this.width - this.width / 2;
            let z_0 = v * this.height - this.height / 2;
            let V = this.scene.state.windSpeed;
            let omega = g / V * Math.sqrt(2 / 3);
            let H = 7.065 * 10e-3 * Math.pow(V, 2.5);
            let r = H / 2;
            let T = 2 * Math.PI / omega;
            let L = g * T * T / (2 * Math.PI);
            let kappa = (2 * Math.PI) / L;
            let phi = kappa * x_0 - omega * t - this.lambda * y * deltaT;
            let wave = new THREE.Vector3(x_0 + r * Math.sin(phi), -r * Math.cos(phi), z_0);
            return wave.applyAxisAngle(yAxis, this.scene.state.windHeading);
        }

        let position = new Float32Array(size * 3);
        for (let i = 0, u = 0; u < this.width; u++) {
            for (let v = 0; v < this.height; v++) {
                this.plane(u, v).toArray(position, i);
            }
        }
        this.geometry = new THREE.BufferGeometry(this.plane, this.width, this.height);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
        this.geometry.attributes.position.usage = THREE.DynamicDrawUsage;

        this.material = new THREE.PointsMaterial({ color: 0x00aaff, size: 5 });
        this.points = new THREE.Points(this.geometry, this.material);
        this.add(this.points);

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }
    update(timeStamp) {
        this.geometry.attributes.position.needsUpdate = true;
        let index = (u, v) => u * this.width + v;
        let deltaT = timeStamp - this.previousTimeStamp;
        this.previousTimeStamp = timeStamp;
        for (let u = 0; u < this.width; u += 1) {
            for (let v = 0; v < this.height; v += 1) {
                let wave = this.plane(u / this.width, v / this.height, this.geometry.attributes.position.array[3 * index(u, v) + 1], deltaT);
                wave.toArray(this.geometry.attributes.position.array, 3 * index(u, v));
            }
        }
    }
}

export default Water;
