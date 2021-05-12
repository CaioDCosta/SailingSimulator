import { Group } from 'three';
import { Chunk, Boundary, Water } from 'objects';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
class Chunks extends Group {
    constructor(scene) {
        super();
        this.params = scene.params.chunk;
        this.boundary = new Boundary(scene, 1000 - Math.min(scene.params.wave.width, scene.params.wave.height), scene.params.wave.width, scene.params.wave.height);
        this.water = new Water(scene, this, this.params.width, this.params.height);
        this.array = [];
        for (let r = -1; r <= 1; r++) {
            let chunks = [];
            for (let c = -1; c <= 1; c++) {
                const chunk = new Chunk(scene,
                    r * this.params.width * this.params.scale,
                    c * this.params.height * this.params.scale);
                chunks.push(chunk);
            }
            this.array.push(chunks);
        }
        this.add(this.water, this.boundary, ...this.array.flat());
        this.translationX = 0;
        this.translationZ = 0;
        this.scene = scene;
    }

    getSlope(x, z, directionVector) {
        let ix = ((Math.floor((x + 1.5 * this.params.width - this.translationX) / this.params.width) % 3) + 3) % 3;
        let iz = ((Math.floor((z + 1.5 * this.params.height - this.translationZ) / this.params.height) % 3) + 3) % 3;
        let chunk = this.array[ix][iz];
        let p = this.getYFromChunk(x, z, chunk);
        let fx = this.getYFromChunk(x + 1, z, chunk) - p;
        let fz = this.getYFromChunk(x, z + 1, chunk) - p;
        let xdir = Math.round(directionVector.x);
        let zdir = Math.round(directionVector.z);
        return fx * xdir + fz * zdir;
    }

    getYFromChunk(x, z, chunk) {
        let [u, v] = chunk.worldXZToUV(x, z);
        u = Math.floor(Math.min(chunk.params.width, Math.max(0, u)));
        v = Math.floor(Math.min(chunk.params.height, Math.max(0, v)));
        return chunk.land.geometry.getAttribute('position').getY(v * (this.params.height + 1) + u);
    }

    getDepth(x, z) {
        let ix = ((Math.floor((x + 1.5 * this.params.width - this.translationX) / this.params.width) % 3) + 3) % 3;
        let iz = ((Math.floor((z + 1.5 * this.params.height - this.translationZ) / this.params.height) % 3) + 3) % 3;
        let chunk = this.array[ix][iz];
        return -this.getYFromChunk(x, z, chunk);
    }

    getWaterHeight(x, z) {
        let X = (x + this.scene.params.wave.width / 2);
        let Z = (z + this.scene.params.wave.height / 2);
        return this.water.geometry.getAttribute('position').getY(Z * (this.scene.params.wave.height + 1) + X);
    }

    translate(x, z) {
        if (Math.abs(x) < Number.EPSILON && Math.abs(z) < Number.EPSILON) return;
        this.translationX += x;
        this.translationZ += z;
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