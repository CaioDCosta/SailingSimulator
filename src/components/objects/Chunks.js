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
                    c * this.params.height * this.params.scale,
                    r * c == 0, r == 0 && c == 0);
                chunks.push(chunk);
            }
            this.array.push(chunks);
        }
        this.add(this.water, this.boundary, ...this.array.flat());
        this.tween = new TWEEN.Tween(this.position);
        this.scene = scene;
    }

    getSlope(x, z, directionVector) {
        let deltaX = Math.round(directionVector.x);
        let deltaZ = Math.round(directionVector.z);
        let depth1 = this.getDepth(x, z);
        let depth2 = this.getDepth(x + deltaX, z + deltaZ);
        return depth2 - depth1;
    }

    getYFromGeometry(x, z, geometry) {
        let X = Math.floor(x + this.params.width / 2);
        let Z = Math.floor(z + this.params.height / 2);
        return geometry.getAttribute('position').getY(X * (this.params.width + 1) + Z);
    }

    getDepth(x, z) {
        return Math.max(0.1, -this.getYFromGeometry(x, z, this.array[1][1].land.geometry));
    }

    getWaterHeight(x, z) {
        return this.getYFromGeometry(x, z, this.water.geometry);
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