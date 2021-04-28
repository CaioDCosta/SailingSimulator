import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const path = require("path")

class Boat extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Load object
        const loader = new GLTFLoader();

        this.name = 'boat';
        loader.load(path.resolve('/src/components/objects/Boat/boat.glb'), (gltf) => {
            this.add(gltf.scene);
        });

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }
    update(timeStamp) {
    }
}

export default Boat;
