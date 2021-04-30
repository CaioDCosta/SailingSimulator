import { Water, Land } from "objects";
import { Group } from "three";

class Chunk extends Group {
    constructor(scene, x0 = 0, z0 = 0) {
        super();

        this.params = scene.params.chunk;
        this.scene = scene;
        this.setPos(x0, z0);

        this.water = new Water(this);
        this.land = new Land(this);
        this.land.position.y = -this.params.seafloor.depth;
        this.add(this.water, this.land);
        scene.addToUpdateList(this);
    }

    setPos(x0, z0) {
        this.position.x = x0;
        this.position.z = z0;
        this.x0 = x0;
        this.z0 = z0;
    }

    uvToWorldXZ(u, v) {
        return [(u - (this.params.width - 1) / 2) * this.params.scale + this.x0, (v - (this.params.height - 1) / 2) * this.params.scale + this.z0];
    }

    uvToLocalXZ(u, v) {
        return [(u - (this.params.width - 1) / 2) * this.params.scale, (v - (this.params.height - 1) / 2) * this.params.scale];
    }

    update(timeStamp) {
        if (this === this.scene.state.boatChunk) this.water.update(timeStamp);
        this.land.position.y = -this.params.seafloor.depth;
    }
}
export default Chunk;