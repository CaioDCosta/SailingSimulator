import * as THREE from 'three';
import { Perlin } from 'utils';
import { Group } from 'three';

class Land extends Group {
    constructor(parent, width, height) {
        // Call parent Group() constructor
        super();
        this.width = width;
        this.height = height;
        let perlin = new Perlin();
        this.scene = parent;
        this.is = {};
        this.generateIslands();

        this.topography = (u, v) => {
            let x = u * width - width / 2;
            let z = v * height - height / 2;
            let s = this.scene.state.seafloor;
            let i = this.scene.state.island;
            let g = 0;
            for (let island of this.islands) {
                g += this.gaussian(x, z, island.x, island.y, island.height, island.varX, island.varY);
            }
            let p = perlin.fBM(x, this.scene.state.windHeading, z, s.init_freq, s.oct, s.lac, s.gain, s.init_amp) * s.amp;
            let y = p + g;
            if (y > i.thresholdMin) {
                let alpha = (y - i.thresholdMin) / (i.thresholdMax - i.thresholdMin);
                let noise = (perlin.fBM(x, this.scene.state.windHeading, z, i.init_freq, i.oct, i.lac, i.gain, i.init_amp) + 1) / 2 * i.amp;
                y += perlin.lerp(Math.min(Math.max(0, alpha), 1), 0, noise);
            }
            return y;
        }
        this.geometry = new THREE.PlaneBufferGeometry(width * 5, height * 5, width - 1, height - 1);
        this.material = new THREE.MeshLambertMaterial({ color: 0x555555, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);

        parent.addToUpdateList(this);
    }

    generateIslands() {

        let is = this.scene.state.island;
        if (this.is.islandsPerChunk == is.islandsPerChunk) return;
        this.islands = [];
        this.is.size = is.size;
        this.is.varX = is.varX;
        this.is.varY = is.varY;
        this.is.height = is.height;
        this.is.islandsPerChunk = is.islandsPerChunk;
        for (let j = 0; j < is.islandsPerChunk; j++) {
            let size = is.size;
            let varX = is.varX * (Math.random() / 2 + 0.5);
            let varY = is.varY * (Math.random() / 2 + 0.5);
            let height = is.height * (Math.random() / 2 + 0.5);
            this.islands.push({ x: (Math.random() - 0.5) * this.width / 2, y: (Math.random() - 0.5) * this.height / 2, height: height, varX: size + varX, varY: size + varY });
        }
    }

    updateIslands() {
        let is = this.scene.state.island;
        if (this.is.size != is.size) {
            for (let island of this.islands) {
                island.varX = island.varX - this.is.size + is.size;
                island.varY = island.varY - this.is.size + is.size;
            }
            this.is.size = is.size;
        }
        if (this.is.varX != is.varX) {
            for (let island of this.islands) {
                let varX = is.varX * (Math.random() / 2 + 0.5);
                let oldVarX = island.varX - this.is.size;
                island.varX = island.varX - oldVarX + varX;
            }
            this.is.varX = is.varX;
        }
        if (this.is.varY != is.varY) {
            for (let island of this.islands) {
                let varY = is.varY * (Math.random() / 2 + 0.5);
                let oldVarY = island.varY - this.is.size;
                island.varY = island.varY - oldVarY + varY;
            }
            this.varY = is.varY;
        }
        if (this.is.height != is.height) {
            for (let island of this.islands) {
                island.height = is.height;
            }
            this.is.height = is.height;
        }
    }

    gaussian(x, y, x_0, y_0, amp, varX = 1, varY = 1) {
        let f = function (a, a_0, vari) {
            return (a - a_0) * (a - a_0) / (2 * vari);
        }
        return amp * Math.exp(-(f(x, x_0, varX) + f(y, y_0, varY)));
    }

    update(timeStamp) {
        let index = (u, v) => u * this.width + v;
        for (let u = 0; u < this.width; u += 1) {
            for (let v = 0; v < this.height; v += 1) {
                let i = index(u, v);
                let y = this.topography(u / this.width, v / this.height);
                this.geometry.attributes.position.setXYZ(i, u * 5 - this.width * 5 / 2, y, v * 5 - this.height * 5 / 2);
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
}

export default Land;
