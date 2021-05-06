import {
    SphereGeometry,
    ShaderMaterial,
    Mesh,
    AdditiveBlending,
    Color,
    Group,
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

        this.sunLight = this.getSpotlight();
        this.shadowLight = this.getSpotlight();
        this.add(this.sunLight, this.shadowLight);

        const geometry = new SphereGeometry(20, 32, 16);
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
            transparent: true,
        });
        this.sun = new Mesh(geometry, material);
        this.add(this.sun);
        scene.addToUpdateList(this);
    }

    getSpotlight() {
        const light = new SpotLight(0xffffff);
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        light.shadow.camera.far = 1500;
        return light;
    }

    update() {
        this.sun.position.set(
            this.params.distance * Math.cos(this.params.zenith) * Math.cos(this.params.azimuth),
            this.params.distance * Math.sin(this.params.azimuth),
            this.params.distance * Math.sin(this.params.zenith) * Math.cos(this.params.azimuth)
        );
        this.uniforms.color.value.setHex(this.params.color);

        this.sunLight.intensity = this.params.intensity / 2;
        this.sunLight.color.setHex(this.params.color);
        this.sunLight.position.copy(this.sun.position);

        this.shadowLight.intensity = this.params.intensity / 2;
        this.shadowLight.color.setHex(this.params.color);
        this.shadowLight.position.copy(this.sun.position);
        this.shadowLight.shadow.focus = Math.min(1, 5 / this.params.distance);
    }
}

export default Sun;
