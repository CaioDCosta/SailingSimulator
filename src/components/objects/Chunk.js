import { Water, Land } from "objects";
import { Group } from "three";

class Chunk extends Group {
    constructor(scene) {
        super();

        this.params = scene.params.chunk;
        this.scene = scene;

        this.water = new Water(this);
        this.land = new Land(this);
        this.land.position.y = -this.params.seafloor.depth;
        this.add(this.water, this.land);
        scene.addToUpdateList(this.water);
        scene.addToUpdateList(this);
    }

    update() {
        this.land.position.y = -this.params.seafloor.depth;
    }
}
export default Chunk;