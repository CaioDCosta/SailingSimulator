import { CameraHelper } from 'three';
import {
    AmbientLight,
    SphereGeometry,
    ShaderMaterial,
    Mesh,
    AdditiveBlending,
    Color,
    Group,
    DirectionalLight,
    SpotLight,
    HemisphereLight,
} from 'three';

class Sun extends Group {
    constructor(scene) {
        // Invoke parent Group() constructor with our args
        super();
        this.params = scene.params.lights;

        this.hemi = new HemisphereLight();
        this.add(this.hemi);

        // this.ambi = new AmbientLight();
        // this.ambi.intensity = 0.2;
        // this.add(this.ambi);

        this.sunLight = this.getDirectionalLight(450);
        // this.sunLight.shadow.bias = 1e6;
        this.shadowLight = this.getDirectionalLight(25);
        this.shadowLight.shadow.bias = -1e-6;
        this.add(this.sunLight, this.shadowLight);

        const geometry = new SphereGeometry(100, 32, 16);
        // Adapted from http://stemkoski.github.io/Three.js/Shader-Halo.html
        const sunVertex = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `;

        const sunFragment = `
            varying vec3 vNormal;
            uniform vec3 color;
            void main() {
                float intensity = pow(vNormal.z, 4.0);
                gl_FragColor = vec4(color * intensity, intensity);
            }
            `;
        this.uniforms = { color: { value: new Color(255, 255, 255) } };
        const material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: sunVertex,
            fragmentShader: sunFragment,
            blending: AdditiveBlending,
            fog: false,
            transparent: true,
        });
        this.sun = new Mesh(geometry, material);
        this.add(this.sun);
        // scene.addToUpdateList(this);
        this.traverse((obj) => obj.name = 'sun');
        this.update();
    }

    getDirectionalLight(radius) {
        const light = new DirectionalLight(0xffffff);
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        light.shadow.camera.far = 10000;
        light.shadow.camera.near = .1;
        light.shadow.camera.right = radius;
        light.shadow.camera.left = -radius;
        light.shadow.camera.top = radius;
        light.shadow.camera.bottom = -radius;
        light.shadow.camera.updateProjectionMatrix();
        return light;
    }

    update() {
        this.sun.position.set(
            this.params.distance * Math.cos(this.params.zenith) * Math.cos(this.params.azimuth),
            this.params.distance * Math.sin(this.params.azimuth),
            this.params.distance * Math.sin(this.params.zenith) * Math.cos(this.params.azimuth)
        );
        this.uniforms.color.value.setHex(this.params.color);

        this.sunLight.intensity = this.params.intensity;
        this.sunLight.color.setHex(this.params.color);
        this.sunLight.position.copy(this.sun.position);

        this.shadowLight.intensity = this.params.intensity / 18;
        this.shadowLight.color.setHex(this.params.color);
        this.shadowLight.position.copy(this.sun.position);
    }
}

export default Sun;
