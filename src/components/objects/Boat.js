import { Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sail } from 'objects';

const path = require("path")

class Boat extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Load object
        const loader = new GLTFLoader();
        this.params = parent.params.boat;
        this.previous = new Vector3();

        this.name = 'boat';
        loader.load(path.resolve('/src/components/objects/res/boat.glb'), (gltf) => {
            this.add(gltf.scene);
        });

        this.scene = parent;

        this.sail = new Sail(this);

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    update(deltaT) {
        let force = this.sail.update(deltaT);
        force.multiplyScalar(this.params.forceMultiplier);
        force.y = 0;
        let deltaPos = new Vector3().subVectors(this.position, this.previous)
            .multiplyScalar(0.5)
            .add(force.multiplyScalar(deltaT * deltaT / this.params.mass));
        this.previous.copy(this.position);
        this.position.add(deltaPos);
    }
}

export default Boat;
