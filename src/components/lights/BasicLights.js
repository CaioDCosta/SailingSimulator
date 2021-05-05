import { Group, PointLight, SpotLight, AmbientLight, HemisphereLight } from 'three';

class BasicLights extends Group {
    constructor(scene) {
        // Invoke parent Group() constructor with our args
        super();
        this.params = scene.params.lights
        this.sun = new SpotLight(0xffffff);
        // const ambi = new AmbientLight(0x404040, 1.32);
        this.hemi = new HemisphereLight(0xffffbb, 0x080820, 1);

        this.sun.position.set(scene.params.wave.width + 100, 100, scene.params.wave.height + 100);
        this.sun.target.position.set(0, 0, 0);
        this.sun.castShadow = true;

        this.sun.shadow.mapSize.set(1024, 1024);

        this.sun.shadow.camera.near = 10;
        this.sun.shadow.camera.far = 4000;
        this.sun.shadow.camera.fov = 30;

        // this.add(ambi, hemi, dir);
        this.add(this.sun, this.hemi);
        scene.addToUpdateList(this);
    }

    update() {
        this.sun.intensity = this.params.intensity;
        this.sun.distance = this.params.distance;
    }
}

export default BasicLights;
