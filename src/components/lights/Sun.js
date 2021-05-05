import { SphereGeometry, ShaderMaterial, Mesh, AdditiveBlending, Color } from 'three';
import { Group, PointLight, SpotLight, AmbientLight, HemisphereLight, Sprite, TextureLoader } from 'three';

class sunLight extends Group {
    constructor(scene) {
        // Invoke parent Group() constructor with our args
        super();
        this.params = scene.params.lights
        this.sunLight = new SpotLight(0xffffff);
        // const ambi = new AmbientLight(0x404040, 1.32);
        this.hemi = new HemisphereLight();

        this.sunLight.position.set(scene.params.wave.width + 100, 100, scene.params.wave.height + 100);
        this.sunLight.target.position.set(0, 0, 0);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.set(1024, 1024);

        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 4000;
        this.sunLight.shadow.camera.fov = 30;

        const geometry = new SphereGeometry(20, 32, 16);

        // Adapted from http://stemkoski.github.io/Three.js/Shader-Halo.html
        const sunVertex =
            `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `

        const sunFragment =
            `
            varying vec3 vNormal;
            uniform vec3 color;
            void main() {
                float intensity = pow(vNormal.z, 4.0);
                gl_FragColor = vec4(color * intensity, intensity);
            }
            `
        this.uniforms = { color: { value: new Color(255, 255, 255) } };
        const material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: sunVertex,
            fragmentShader: sunFragment,
            blending: AdditiveBlending,
            transparent: true
        });
        this.sun = new Mesh(geometry, material);

        this.add(this.sun);
        // this.add(ambi, hemi, dir);
        this.add(this.sunLight, this.hemi);
        scene.addToUpdateList(this);
    }

    update() {
        this.sunLight.intensity = this.params.intensity;
        this.sunLight.color.setHex(this.params.color);
        this.uniforms.color.value.setHex(this.params.color);
        this.sunLight.position.set(this.params.distance * Math.cos(this.params.azimuth), this.params.distance * Math.sin(this.params.azimuth), 0);
        this.sun.position.copy(this.sunLight.position);
    }
}

export default sunLight;
