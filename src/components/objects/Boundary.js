import { Group, PlaneGeometry, Mesh, MeshStandardMaterial, DoubleSide, TextureLoader } from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
class Boundary extends Group {
    constructor(scene, targetSize, width, height) {
        super();
        this.width = width;
        this.height = height;
        this.scene = scene;

        const longGeo = new PlaneGeometry(targetSize, (targetSize - height) / 2);
        const bumpTexture = new TextureLoader().load("/src/components/objects/res/water_normals.jpg");
        const boundaryMaterial = new MeshStandardMaterial({ color: 0x0010ff, side: DoubleSide, bumpMap: bumpTexture });
        const shortGeo = new PlaneGeometry((targetSize - width) / 2, height);

        const long1 = new Mesh(longGeo, boundaryMaterial);
        const long2 = new Mesh(longGeo, boundaryMaterial);
        const short1 = new Mesh(shortGeo, boundaryMaterial);
        const short2 = new Mesh(shortGeo, boundaryMaterial);
        long1.receiveShadow = true;
        long2.receiveShadow = true;
        short1.receiveShadow = true;
        short2.receiveShadow = true;

        long1.rotation.x += Math.PI / 2;
        long2.rotation.x += Math.PI / 2;
        short1.rotation.x += Math.PI / 2;
        short2.rotation.x += Math.PI / 2;

        long1.translateY((targetSize + height) / 4);
        long2.translateY(-(targetSize + height) / 4);
        short1.translateX((targetSize + width) / 4)
        short2.translateX(-(targetSize + width) / 4);

        this.add(long1, long2, short1, short2);
    }

    translate(x, z) {

    }
}

export default Boundary;