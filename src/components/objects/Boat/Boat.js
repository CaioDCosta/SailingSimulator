import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sail } from 'objects';
import * as THREE from 'three';

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

        this.sail = new Sail(parent);
        this.add(this.sail);

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    update(timeStamp) {
        this.sail.update(timeStamp);
    }
}

export default Boat;
