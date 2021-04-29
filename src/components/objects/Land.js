import * as THREE from 'three';
import { Perlin } from 'utils';
import { Group } from 'three';

class Land extends Group {
    constructor(parent, width, height) {
        // Call parent Group() constructor
        super();
        this.width = width;
        this.height = height;
        let perlin = new Perlin();
        this.scene = parent;
        this.topography = (u, v, vec) => {
            let x = u * width - width / 2;
            let z = v * height - height / 2;
            let y = perlin.noise(x, this.scene.state.windHeading, z) * 50;
            vec.set(x, y, z);
        }
        this.geometry = new THREE.PlaneBufferGeometry(width, height, width, height);
        this.material = new THREE.MeshLambertMaterial({ color: 0x555555, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);

        parent.addToUpdateList(this);
    }

    update(timeStamp) {
        let index = (u, v) => u * this.width + v;

        let vec = new THREE.Vector3();
        for (let u = 0; u < this.width; u += 1) {
            for (let v = 0; v < this.height; v += 1) {
                let i = index(u, v);
                this.topography(u / this.width, v / this.height, vec);
                this.geometry.attributes.position.setXYZ(i, ...vec.toArray());
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
}

export default Land;
