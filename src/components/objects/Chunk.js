import { Land } from "objects";
import { Group } from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min";

class Chunk extends Group {
    constructor(scene, x0 = 0, z0 = 0) {
        super();

        this.params = scene.params.chunk;
        this.scene = scene;
        this.position.x = x0;
        this.position.z = z0;
        this.x0 = x0;
        this.z0 = z0;
        this.land = new Land(this);
        this.add(this.land);

        this.castShadow = true;
        this.receiveShadow = true;

        scene.addToUpdateList(this);
    }

    translate(x, z) {
        if (this.position.x + x > 3 / 2 * this.params.width) {
            this.position.x -= 3 * this.params.width;
            this.x0 -= 3 * this.params.width;
            this.land.updateIslands('new');
        }
        else if (this.position.x + x < -3 / 2 * this.params.width) {
            this.position.x += 3 * this.params.width;
            this.x0 += 3 * this.params.width;
            this.land.updateIslands('new');
        }
        else if (this.position.z - z > 3 / 2 * this.params.height) {
            this.position.z -= 3 * this.params.height;
            this.z0 -= 3 * this.params.height;
            this.land.updateIslands('new');
        }
        else if (this.position.z - z < -3 / 2 * this.params.height) {
            this.position.z += 3 * this.params.height;
            this.z0 += 3 * this.params.height;
            this.land.updateIslands('new');
        }
        new TWEEN.Tween(this.position).to({ x: this.position.x + x, z: this.position.z + z }, this.scene.params.interval * 1000).start(this.scene.state.time);
    }

    uvToWorldXZ(u, v) {
        return [(u - this.params.width / 2) * this.params.scale + this.x0, (v - this.params.height / 2) * this.params.scale + this.z0];
    }

    uvToLocalXZ(u, v) {
        return [(u - this.params.width / 2) * this.params.scale, (v - this.params.height / 2) * this.params.scale];
    }

    update(deltaT) {
    }
}
export default Chunk;