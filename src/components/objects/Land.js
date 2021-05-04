import * as THREE from 'three';
import { Perlin } from 'utils';
import { Group } from 'three';

class Land extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.params = parent.params;
        this.islands = this.generateIslands(true);
        this.chunk = parent;
        this.geometry = new THREE.PlaneBufferGeometry(this.params.width * this.params.scale,
            this.params.height * this.params.scale, this.params.width, this.params.height);
        this.material = new THREE.MeshLambertMaterial({ color: 0x555555, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);

        this.updateGeometry();
    }

    topography(x, z, wx, wz) {
        let s = this.params.seafloor;
        let i = this.params.island;
        let g = 0;

        // Don't add islands at boundaries
        let distX = this.params.width / 2 - Math.abs(x);
        let distZ = this.params.height / 2 - Math.abs(z);
        let fadeThresh = 20;
        distX = Math.max(0, Math.min(1, (distX - fadeThresh) / fadeThresh));
        distZ = Math.max(0, Math.min(1, (distZ - fadeThresh) / fadeThresh));
        for (let island of this.islands) {
            let gauss = this.gaussian(x, z, island.x, island.z, island.peak, island.varX, island.varY);
            if (gauss > 0.05) g += gauss * Perlin.fade(distX) * Perlin.fade(distZ);
        }
        let p = Perlin.fBM(wx, 0, wz, s.init_freq, s.oct, s.lac, s.gain, s.init_amp) * s.amp;
        let y = p + g;
        if (y > i.thresholdMin) {
            let alpha = (y - i.thresholdMin) / (i.thresholdMax - i.thresholdMin);
            let noise = (Perlin.fBM(wx, 0, wz, i.init_freq, i.oct, i.lac, i.gain, i.init_amp) + 1) / 2 * i.amp;
            y += Perlin.lerp(Math.min(Math.max(0, alpha), 1), 0, noise);
        }
        return y;
    }

    updateGeometry() {
        let w = this.params.width;
        let h = this.params.height;
        let index = (u, v) => v * (h + 1) + u;
        for (let v = 0; v <= h; v += 1) {
            for (let u = 0; u <= w; u += 1) {
                let i = index(u, v);
                let [wx, wz] = this.chunk.uvToWorldXZ(u, v);
                let [x, z] = this.chunk.uvToLocalXZ(u, v);
                let y = this.topography(x, z, wx, wz);
                this.geometry.attributes.position.setXYZ(i, x, y, z);
            }
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    generateIslands(newNum = false) {
        let is = this.params.island;
        let islands = [];
        if (newNum) {
            this.numIslands = Math.floor(Math.random() * (is.maxIslandsPerChunk - is.minIslandsPerChunk)) + is.minIslandsPerChunk;
        }
        for (let j = 0; j < this.numIslands; j++) {
            islands.push({
                x: (Math.random() - 0.5) * this.params.width / 2,
                z: (Math.random() - 0.5) * this.params.height / 2,
                peak: is.height * (Math.random() + 0.5),
                varX: is.size + is.varX * (Math.random() - 0.5),
                varY: is.size + is.varY * (Math.random() - 0.5)
            });
        }
        return islands;
    }

    updateIslands(attribute) {
        if (attribute !== undefined) {
            if (attribute == 'new') {
                this.islands = this.generateIslands(true);
            }
            else {
                let islands = this.generateIslands();
                for (let i = 0; i < this.islands.length; i++) {
                    if (attribute == 'size') {
                        this.islands[i].varX = islands[i].varX;
                        this.islands[i].varY = islands[i].varY;
                    } else {
                        this.islands[i][attribute] = islands[i][attribute];
                    }
                }
            }
        }
        this.updateGeometry();
    }

    gaussian(x, y, x_0, y_0, amp, varX = 1, varY = 1) {
        let f = function (a, a_0, vari) {
            return (a - a_0) * (a - a_0) / (2 * vari);
        }
        return amp * Math.exp(-(f(x, x_0, varX) + f(y, y_0, varY)));
    }
}

export default Land;
