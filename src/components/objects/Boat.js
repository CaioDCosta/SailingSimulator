import { Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sail } from 'objects';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';

const path = require('path');

class Boat extends Group {
    constructor(scene) {
        // Call parent Group() constructor
        super();

        // Load object
        const loader = new GLTFLoader();
        this.params = scene.params.boat;
        this.velocity = new Vector3();
        this.previous = new Vector3();
        this.scene = scene;

        this.name = 'boat';
        loader.load(
            path.resolve('/src/components/objects/res/boat.glb'),
            (gltf) => {
                gltf.scene.traverse((node) => {
                    if (node.isMesh) {
                        node.layers.set(1);
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.geometry.computeVertexNormals();
                    }
                });
                gltf.scene.layers.set(1);
                this.add(gltf.scene);
            }
        );

        this.sail = new Sail(this);
        this.tween = new TWEEN.Tween(this.position).easing(TWEEN.Easing.Elastic.InOut);
        this.layers.set(1); // Shadow layer
        this.traverse((obj) => {
            obj.layers.set(1);
        });
        // Add self to parent's update list
        scene.addToUpdateList(this);
    }

    update(deltaT) {
        let force = this.sail.update(deltaT);
        force.y = 0;
        this.velocity.multiplyScalar(1 - this.params.damping)
            .add(force.multiplyScalar(this.params.forceMultiplier * deltaT * deltaT / this.params.mass));
        this.velocity.multiplyScalar(this.params.velocityMultiplier);
    }
}

export default Boat;
