import { Group, Vector3, BoxGeometry, Mesh, MeshToonMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sail } from 'objects';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import MODEL from './res/boat.glb';

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
            MODEL,
            (gltf) => {
                gltf.scene.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.geometry.computeVertexNormals();
                    }
                });
                this.add(gltf.scene);
            }
        );

        this.sail = new Sail(this);
        this.tween = new TWEEN.Tween(this.position).easing(TWEEN.Easing.Elastic.InOut);
        this.rudder = {};
        this.rudder.geometry = new BoxGeometry(.05, .7, .25);
        this.rudder.material = new MeshToonMaterial({ color: 0x603913 });
        this.rudder.mesh = new Mesh(this.rudder.geometry, this.rudder.material);
        this.rudder.mesh.position.set(0, .1, -.9);
        this.rudder.mesh.castShadow = true;
        this.rudder.mesh.receiveShadow = true;
        this.add(this.rudder.mesh);
        // Add self to parent's update list
        scene.addToUpdateList(this);
    }

    update(deltaT) {

        // this.rudder.rotation = rot;
        // this.rotation.y += rot / this.params.turningSpeed;

        let force = this.sail.update(deltaT);
        force.y = 0;
        this.velocity.multiplyScalar(1 - this.params.damping)
            .add(force.multiplyScalar(this.params.forceMultiplier * deltaT * deltaT / this.params.mass));
        this.velocity.multiplyScalar(this.params.velocityMultiplier);
    }
}

export default Boat;
