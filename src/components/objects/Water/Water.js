import * as THREE from 'three';

class Water extends THREE.Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        const geometry = new THREE.PlaneGeometry(400, 400, 200, 200);
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x000aff, side: THREE.DoubleSide });

        const mesh = new THREE.Mesh(geometry, material);
        this.add(mesh);


        // Add self to parent's update list
        parent.addToUpdateList(this);
    }
    update(timeStamp) {
    }
}

export default Water;
