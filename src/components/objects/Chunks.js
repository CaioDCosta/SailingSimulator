import { Group, PlaneGeometry, MeshStandardMaterial, Mesh, DoubleSide } from 'three';
import { Chunk } from 'objects';
class Chunks extends Group {
    constructor(scene) {
        super();
        let targetSize = 500;
        this.params = scene.params;
        let chunkHalfWidth = this.params.chunk.width / 2;
        let chunkHalfHeight = this.params.chunk.height / 2;
        let cornerWidth = targetSize - chunkHalfWidth;
        let cornerHeight = targetSize - chunkHalfHeight;
        const cornerGeometry = new PlaneGeometry(cornerWidth, cornerHeight);
        const boundaryMaterial = new MeshStandardMaterial({ color: 0x0010ff, side: DoubleSide });
        let corner1 = new Mesh(cornerGeometry, boundaryMaterial);
        let corner2 = new Mesh(cornerGeometry, boundaryMaterial);
        let corner3 = new Mesh(cornerGeometry, boundaryMaterial);
        let corner4 = new Mesh(cornerGeometry, boundaryMaterial);


        corner1.translateX(cornerWidth / 2 + chunkHalfWidth - 0.5);
        corner1.translateZ(cornerHeight / 2 + chunkHalfHeight - 0.5);
        corner2.translateX(-(cornerWidth / 2 + chunkHalfWidth - 0.5));
        corner2.translateZ(cornerHeight / 2 + chunkHalfHeight - 0.5);
        corner3.translateX(-(cornerWidth / 2 + chunkHalfWidth - 0.5));
        corner3.translateZ(-(cornerHeight / 2 + chunkHalfHeight - 0.5));
        corner4.translateX(cornerWidth / 2 + chunkHalfWidth - 0.5);
        corner4.translateZ(-(cornerHeight / 2 + chunkHalfHeight - 0.5));

        corner1.rotation.x += Math.PI / 2;
        corner2.rotation.x += Math.PI / 2;
        corner3.rotation.x += Math.PI / 2;
        corner4.rotation.x += Math.PI / 2;

        this.add(corner1, corner2, corner3, corner4);

        let chunkThreeHalvesHeight = 3 * chunkHalfHeight;
        let chunkThreeHalvesWidth = 3 * chunkHalfWidth;

        let edgeHeight = targetSize - chunkThreeHalvesHeight;
        let edgeWidth = targetSize - chunkThreeHalvesWidth;
        const edgeGeometryHeight = new PlaneGeometry(this.params.chunk.width, edgeHeight);
        let edgez1 = new Mesh(edgeGeometryHeight, boundaryMaterial);
        let edgez2 = new Mesh(edgeGeometryHeight, boundaryMaterial);
        edgez1.translateZ(edgeHeight / 2 + chunkThreeHalvesHeight - 2);
        edgez2.translateZ(-(edgeHeight / 2 + chunkThreeHalvesHeight - 2));
        edgez1.rotation.x += Math.PI / 2;
        edgez2.rotation.x += Math.PI / 2;

        const edgeGeometryWidth = new PlaneGeometry(edgeWidth, this.params.chunk.height);
        let edgex1 = new Mesh(edgeGeometryWidth, boundaryMaterial);
        let edgex2 = new Mesh(edgeGeometryWidth, boundaryMaterial);
        edgex1.translateX(edgeWidth / 2 + chunkThreeHalvesWidth - 2);
        edgex2.translateX(-(edgeWidth / 2 + chunkThreeHalvesWidth - 2));
        edgex1.rotation.x += Math.PI / 2;
        edgex2.rotation.x += Math.PI / 2;
        edgex1.rotation.y += Math.PI;
        edgex2.rotation.y += Math.PI;
        this.add(edgez1, edgez2, edgex1, edgex2);


        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const chunk = new Chunk(scene,
                    r * (this.params.chunk.width - 1) * this.params.chunk.scale,
                    c * (this.params.chunk.height - 1) * this.params.chunk.scale,
                    r * c == 0, r == 0 && c == 0);
                this.add(chunk)
            }
        }
    }

    update(arg) {
        for (let child of this.children) {
            if (child instanceof Chunk) {
                child.land.updateIslands(arg);
            }
        }
    }
}

export default Chunks;