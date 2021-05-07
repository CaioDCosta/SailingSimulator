import { Group, PlaneGeometry, Mesh, LuminanceFormat, FrontSide, TextureLoader, DataTexture, NearestFilter, MeshPhysicalMaterial } from 'three';
import TEXTURE from './res/water_normals.png';
import ENVMAP from './res/ToonEquirectangular.png';
class Boundary extends Group {
    constructor(scene, targetSize, width, height) {
        super();
        this.width = width;
        this.height = height;
        this.scene = scene;

        const longGeo = new PlaneGeometry(targetSize, (targetSize - height) / 2);
        const loader = new TextureLoader();
        const bumpTexture = loader.load(TEXTURE);
        const colors = new Uint8Array(5);
        for (let c = 0; c <= colors.length; c++) {
            colors[c] = (c / colors.length) * 256;
        }

        const gradientMap = new DataTexture(colors, colors.length, 1, LuminanceFormat);
        gradientMap.minFilter = NearestFilter;
        gradientMap.magFilter = NearestFilter;
        gradientMap.generateMipmaps = false;
        // const boundaryMaterial = new MeshToonMaterial({ color: 0x0010ff, side: FrontSide, bumpMap: bumpTexture, gradientMap: gradientMap });
        const envMap = loader.load(ENVMAP);
        const boundaryMaterial = new MeshPhysicalMaterial({
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transmission: .4,
            ior: .1,
            reflectivity: .7,
            opacity: 1,
            color: 0x0010ff,
            side: FrontSide,
            envMap: envMap,
            bumpMap: bumpTexture,
            transparent: true
        });
        const shortGeo = new PlaneGeometry((targetSize - width) / 2, height);

        const long1 = new Mesh(longGeo, boundaryMaterial);
        const long2 = new Mesh(longGeo, boundaryMaterial);
        const short1 = new Mesh(shortGeo, boundaryMaterial);
        const short2 = new Mesh(shortGeo, boundaryMaterial);
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