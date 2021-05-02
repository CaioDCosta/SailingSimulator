import { Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sail } from 'objects';

const path = require("path")

class Boat extends Group {
    constructor(scene) {
        // Call parent Group() constructor
        super();

        // Load object
        const loader = new GLTFLoader();
        this.params = scene.params.boat;
        this.deltaPos = new Vector3();
        this.previous = new Vector3();
        this.scene = scene;

        this.name = 'boat';
        loader.load(path.resolve('/src/components/objects/res/boat.glb'), (gltf) => {
            this.add(gltf.scene);
        });

        this.sail = new Sail(this);

        // Add self to parent's update list
        scene.addToUpdateList(this);
    }

    update(deltaT) {
        let force = this.sail.update(deltaT);
        force.multiplyScalar(this.params.forceMultiplier);
        force.y = 0;
        this.deltaPos.multiplyScalar(0.5)
            .add(force.multiplyScalar(deltaT * deltaT / this.params.mass));
    }
}

export default Boat;
