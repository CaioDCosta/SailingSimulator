import { Group, PlaneGeometry, Mesh, MeshStandardMaterial, DoubleSide } from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
class Boundary extends Group {
    constructor(scene, targetSize, width, height) {
        super();
        this.width = width;
        this.height = height;
        this.scene = scene;
        let chunkHalfWidth = width / 2;
        let chunkHalfHeight = height / 2;
        let cornerWidth = targetSize - chunkHalfWidth;
        let cornerHeight = targetSize - chunkHalfHeight;
        const cornerGeometry = new PlaneGeometry(cornerWidth, cornerHeight);
        const boundaryMaterial = new MeshStandardMaterial({ color: 0x0010ff, side: DoubleSide });
        let corner1 = new Mesh(cornerGeometry, boundaryMaterial);
        let corner2 = new Mesh(cornerGeometry, boundaryMaterial);
        let corner3 = new Mesh(cornerGeometry, boundaryMaterial);
        let corner4 = new Mesh(cornerGeometry, boundaryMaterial);


        corner1.translateX(cornerWidth / 2 + chunkHalfWidth);
        corner1.translateZ(cornerHeight / 2 + chunkHalfHeight);
        corner2.translateX(-(cornerWidth / 2 + chunkHalfWidth));
        corner2.translateZ(cornerHeight / 2 + chunkHalfHeight);
        corner3.translateX(-(cornerWidth / 2 + chunkHalfWidth));
        corner3.translateZ(-(cornerHeight / 2 + chunkHalfHeight));
        corner4.translateX(cornerWidth / 2 + chunkHalfWidth);
        corner4.translateZ(-(cornerHeight / 2 + chunkHalfHeight));

        corner1.rotation.x += Math.PI / 2;
        corner2.rotation.x += Math.PI / 2;
        corner3.rotation.x += Math.PI / 2;
        corner4.rotation.x += Math.PI / 2;

        this.add(corner1, corner2, corner3, corner4);

        let chunkThreeHalvesHeight = 3 * chunkHalfHeight;
        let chunkThreeHalvesWidth = 3 * chunkHalfWidth;

        let edgeHeight = targetSize - chunkThreeHalvesHeight;
        let edgeWidth = targetSize - chunkThreeHalvesWidth;
        const edgeGeometryHeight = new PlaneGeometry(width, edgeHeight);
        let edgez1 = new Mesh(edgeGeometryHeight, boundaryMaterial);
        let edgez2 = new Mesh(edgeGeometryHeight, boundaryMaterial);
        edgez1.translateZ(edgeHeight / 2 + chunkThreeHalvesHeight - 2);
        edgez2.translateZ(-(edgeHeight / 2 + chunkThreeHalvesHeight - 2));
        edgez1.rotation.x += Math.PI / 2;
        edgez2.rotation.x += Math.PI / 2;

        const edgeGeometryWidth = new PlaneGeometry(edgeWidth, height);
        let edgex1 = new Mesh(edgeGeometryWidth, boundaryMaterial);
        let edgex2 = new Mesh(edgeGeometryWidth, boundaryMaterial);
        edgex1.translateX(edgeWidth / 2 + chunkThreeHalvesWidth);
        edgex2.translateX(-(edgeWidth / 2 + chunkThreeHalvesWidth));
        edgex1.rotation.x += Math.PI / 2;
        edgex2.rotation.x += Math.PI / 2;
        edgex1.rotation.y += Math.PI;
        edgex2.rotation.y += Math.PI;
        this.add(edgez1, edgez2, edgex1, edgex2);
    }

    translate(x, z) {
        let width = this.width, height = this.height;
        if (this.position.x + x > width / 2) {
            this.position.x -= width;
        }
        else if (this.position.x + x < -width / 2) {
            this.position.x += width;
        }
        else if (this.position.z + z > height / 2) {
            this.position.z -= height;
        }
        else if (this.position.z + z < -height / 2) {
            this.position.z += height;
        }
        new TWEEN.Tween(this.position).to({ x: this.position.x + x, z: this.position.z + z }, this.scene.params.interval * 1000).start();
    }
}

export default Boundary;