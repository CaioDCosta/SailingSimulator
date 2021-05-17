import { Group, Vector3, BoxGeometry, Mesh, MeshToonMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sail } from 'objects';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import MODEL from './res/boat.glb';
import { Vector2 } from 'three';

class Boat extends Group {
    constructor(scene) {
        // Call parent Group() constructor
        super();

        // Load object
        const loader = new GLTFLoader();
        this.params = scene.params.boat;
        this.velocity = new Vector3();
        this.acceleration = new Vector3();
        this.prevAcceleration = new Vector3();
        this.drag = new Vector3();
        this.zero = new Vector3();
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
        this.rotTween = new TWEEN.Tween(this.rotation).easing(TWEEN.Easing.Elastic.InOut);
        this.rudder = {};
        this.rudder.geometry = new BoxGeometry(.05, .7, .25);
        this.rudder.material = new MeshToonMaterial({ color: 0x603913 });
        this.rudder.mesh = new Mesh(this.rudder.geometry, this.rudder.material);
        this.rudder.mesh.position.set(0, .1, .9);
        this.rudder.mesh.castShadow = true;
        this.rudder.mesh.receiveShadow = true;
        this.rudder.tween = new TWEEN.Tween(this.rudder.mesh.rotation)

        this.forward = new Vector2();
        this.attach(this.rudder.mesh);
        // Add self to parent's update list
        scene.addToUpdateList(this);
    }

    update(deltaT) {
        this.oldAcceleration = this.acceleration;
        this.sail.update(deltaT);
        this.acceleration.set(Math.sin(this.rotation.y - Math.PI), 0, Math.cos(this.rotation.y - Math.PI));
        this.acceleration.multiplyScalar(Math.max(-0.1, this.acceleration.dot(this.scene.state.windDirection)) * this.scene.state.windSpeed);
        this.acceleration.divideScalar(this.params.mass);
        this.oldAcceleration.add(this.acceleration).multiplyScalar(deltaT / 2);
        this.velocity.add(this.oldAcceleration).clampScalar(-this.params.maxVelocity, this.params.maxVelocity).multiplyScalar(1 - this.params.drag);
    }
}

export default Boat;
