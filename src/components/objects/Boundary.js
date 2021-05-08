import { Group, PlaneGeometry, Mesh, LuminanceFormat, FrontSide, TextureLoader, RepeatWrapping, MeshPhysicalMaterial } from 'three';
import TEXTURE from './res/water_normals.png';
import ENVMAP from './res/ToonEquirectangular.png';
class Boundary extends Group {
    constructor(scene, targetSize, width, height) {
        super();
        this.width = width;
        this.height = height;
        this.scene = scene;

        const longGeo = new PlaneGeometry(targetSize, (targetSize - height) / 2);
        const shortGeo = new PlaneGeometry((targetSize - width) / 2, height);
        const loader = new TextureLoader();
        const bumpTexture = loader.load(TEXTURE);
        bumpTexture.repeat.set(16 / width * (targetSize - width) / 2, 16);
        bumpTexture.wrapS = bumpTexture.wrapT = RepeatWrapping;

        const bumpTextureRotated = loader.load(TEXTURE);
        bumpTextureRotated.repeat.set(16 / width * targetSize, 16 / height * (targetSize - height) / 2);
        bumpTextureRotated.wrapS = bumpTextureRotated.wrapT = RepeatWrapping;
        // const boundaryMaterial = new MeshToonMaterial({ color: 0x0010ff, side: FrontSide, bumpMap: bumpTexture, gradientMap: gradientMap });
        const envMap = loader.load(ENVMAP);
        const shortMaterial = new MeshPhysicalMaterial({
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transmission: .4,
            ior: .1,
            reflectivity: .7,
            roughness: 0.5,
            opacity: 1,
            color: 0x0010ff,
            side: FrontSide,
            envMap: envMap,
            bumpMap: bumpTexture,
            transparent: true
        });
        const longMaterial = new MeshPhysicalMaterial({
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transmission: .4,
            ior: .1,
            reflectivity: .7,
            roughness: 0.5,
            opacity: 1,
            color: 0x0010ff,
            side: FrontSide,
            envMap: envMap,
            bumpMap: bumpTextureRotated,
            transparent: true
        });

        const long1 = new Mesh(longGeo, longMaterial);
        const long2 = new Mesh(longGeo, longMaterial);
        const short1 = new Mesh(shortGeo, shortMaterial);
        const short2 = new Mesh(shortGeo, shortMaterial);
        long1.receiveShadow = true;
        long2.receiveShadow = true;
        short1.receiveShadow = true;
        short2.receiveShadow = true;

        long1.rotation.x -= Math.PI / 2;
        long2.rotation.x -= Math.PI / 2;
        short1.rotation.x -= Math.PI / 2;
        short2.rotation.x -= Math.PI / 2;

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