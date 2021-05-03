import { Group } from 'three';
import { Chunk, Boundary, Water } from 'objects';
class Chunks extends Group {
    constructor(scene) {
        super();
        this.params = scene.params.chunk;
        // this.boundary = new Boundary(scene, 500, this.params.width, this.params.height);
        this.water = new Water(scene, this.params.width, this.params.height);
        this.array = [];
        for (let r = -1; r <= 1; r++) {
            let chunks = [];
            for (let c = -1; c <= 1; c++) {
                const chunk = new Chunk(scene,
                    r * this.params.width * this.params.scale,
                    c * this.params.height * this.params.scale,
                    r * c == 0, r == 0 && c == 0);
                chunks.push(chunk);
            }
            this.array.push(chunks);
        }
        this.add(this.water, ...this.array.flat());
    }

    translate(x, z) {
        if (Math.abs(x) < Number.EPSILON && Math.abs(z) < Number.EPSILON) return;
        for (let chunk of this.array.flat()) {
            chunk.translate(x, z);
        }
        this.water.translate(x, z);
    }

    update(arg) {
        for (let chunk of this.array.flat()) {
            chunk.land.updateIslands(arg);
        }
    }
}

export default Chunks;