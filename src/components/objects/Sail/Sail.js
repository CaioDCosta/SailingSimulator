import { Group } from 'three';
import * as THREE from 'three';
import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils.js'

class Particle {
    constructor(vec, mass) {
        this.position = vec; // position
        this.previous = vec; // previous
        this.original = vec; // original

        this.netForce = new THREE.Vector3(); // net force acting on particle
        this.mass = mass; // mass of the particle
    }

    // Snap a particle back to its original position
    lockToOriginal() {
        this.position.copy(this.original);
        this.previous.copy(this.original);
    }

    // Snap a particle back to its previous position
    lock() {
        this.position.copy(this.previous);
        this.previous.copy(this.previous);
    }

    // Add the given force to a particle's total netForce.
    // Params:
    // * force: THREE.Vector3 - the force to add
    addForce(force) {
        this.netForce.add(force);
    }

    // Perform Verlet integration on this particle with the provided
    // timestep deltaT.
    // Params:
    // * deltaT: Number - the length of time dt over which to integrate
    integrate(deltaT) {
        const DAMPING = 0.3;
        let newPos = new THREE.Vector3()
            .subVectors(this.position, this.previous)
            .multiplyScalar(1 - DAMPING)
            .add(this.netForce.multiplyScalar(deltaT * deltaT / this.mass));
        newPos.add(this.position);
        this.previous = this.position;
        this.position = newPos;
        this.netForce.set(0, 0, 0);
    }
}


class Constraint {
    constructor(p1, p2, distance) {
        this.p1 = p1; // Particle 1
        this.p2 = p2; // Particle 2
        this.distance = distance; // Desired distance
    }

    enforce() {
        let corr = new THREE.Vector3().subVectors(this.p1.position, this.p2.position);
        let mag = corr.length();
        corr.multiplyScalar(1 - this.distance / mag).divideScalar(2);
        this.p1.position.sub(corr);
        this.p2.position.add(corr);
    }
}

class Sail extends Group {

    constructor(scene) {
        // Call parent Group() constructor
        super();

        this.prevTimeStamp = 0;

        // Resting Distances
        let fabricLength = 6;
        this.fabricLength = fabricLength;
        this.restDistance = 1; // for adjacent particles
        this.restDistanceB = 2; // multiplier for 2-away particles
        this.restDistanceS = Math.sqrt(2);
        this.particleMass = 0.1;
        this.gravity = 10;

        // Width and height
        let w = this.fabricLength / this.restDistance;
        let h = this.fabricLength / this.restDistance;
        this.w = w;
        this.h = h;
        this.scene = scene;
        let sailOffset = 4;
        this.getInitPosition = function (u, v, vec) {
            let x = u * fabricLength - fabricLength / 2;
            let y = v * fabricLength + sailOffset;
            let z = .25;
            vec.set(x, y, z);
        }

        let index = function (u, v) {
            return u + v * (w + 1);
        }

        this.index = index;

        let sail = {};
        sail.geometry = new THREE.ParametricGeometry(this.getInitPosition, this.w, this.h);
        sail.geometry.dynamic = true;
        sail.material = new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: THREE.DoubleSide, flatShading: true });
        sail.mesh = new THREE.Mesh(sail.geometry, sail.material);
        sail.mesh.castShadow = true;
        this.sail = sail;

        let mast = {};
        let mastHeight = this.fabricLength + sailOffset - 1;
        mast.geometry = new THREE.BoxGeometry(.5, mastHeight, .5);
        mast.geometry.translate(0, mastHeight / 2 + 1, 0);
        mast.material = new THREE.MeshStandardMaterial({ color: 0x603913 });
        mast.mesh = new THREE.Mesh(mast.geometry, mast.material);
        this.mast = mast;

        let boom = {};
        boom.geometry = new THREE.BoxGeometry(this.fabricLength, .5, .5);
        boom.material = new THREE.MeshStandardMaterial({ color: 0x603913 });
        boom.mesh1 = new THREE.Mesh(boom.geometry, boom.material);
        boom.mesh1.translateY(sailOffset);
        boom.mesh2 = new THREE.Mesh(boom.geometry, boom.material);
        boom.mesh2.translateY(sailOffset + this.fabricLength);
        this.boom = boom;

        this.add(this.sail.mesh);
        this.add(this.mast.mesh);
        this.add(this.boom.mesh1);
        this.add(this.boom.mesh2);

        this.translateZ(1);

        // Empty initial lists
        let particles = [];
        let constraints = [];

        // Create particles
        for (let v = 0; v <= h; v++) {
            for (let u = 0; u <= w; u++) {
                let vec = new THREE.Vector3();
                this.getInitPosition(u / this.w, v / this.h, vec);
                particles.push(new Particle(vec, this.particleMass));
            }
        }

        for (let v = 0; v <= h; v++) {
            for (let u = 0; u <= w; u++) {
                // Structural 
                if (u >= 0 && u <= w && v < h) {
                    constraints.push(new Constraint(particles[index(u, v)], particles[index(u, v + 1)], this.restDistance));
                }
                if (v >= 0 && v <= h && u < w) {
                    constraints.push(new Constraint(particles[index(u, v)], particles[index(u + 1, v)], this.restDistance));
                }

                // Shear
                if (u > 0 && v < h) {
                    constraints.push(new Constraint(particles[index(u, v)], particles[index(u - 1, v + 1)], this.restDistance * this.restDistanceS));
                }
                if (u < w && v < h) {
                    constraints.push(new Constraint(particles[index(u, v)], particles[index(u + 1, v + 1)], this.restDistance * this.restDistanceS));
                }

                // Bending
                if (u < w - 1) {
                    constraints.push(new Constraint(particles[index(u, v)], particles[index(u + 2, v)], this.restDistance * this.restDistanceB));
                }
                if (v < h - 1) {
                    constraints.push(new Constraint(particles[index(u, v)], particles[index(u, v + 2)], this.restDistance * this.restDistanceB));
                }
            }
        }

        // Store the particles and constraints lists into the cloth object
        this.particles = particles;
        this.constraints = constraints;
        this.scene.add(this);
    }

    applyForces() {
        this.applyGravity();
        this.applyWind();
    }

    applyWind() {
        let windForce = this.scene.state.windDirection.normalize().multiplyScalar(this.scene.state.windSpeed);

        // Apply the wind force to the cloth particles
        let faces = this.sail.geometry.faces;
        for (let face of faces) {
            let normal = face.normal;
            let tmpForce = normal
                .clone()
                .normalize()
                .multiplyScalar(normal.dot(windForce));
            this.particles[face.a].addForce(tmpForce);
            this.particles[face.b].addForce(tmpForce);
            this.particles[face.c].addForce(tmpForce);
        }
    }

    applyGravity() {
        for (let particle of this.particles) {
            particle.addForce(new THREE.Vector3(0, -particle.mass * this.gravity, 0));
        }
    }

    update(timeStamp) {
        let deltaT = (timeStamp - this.prevTimeStamp) / 1000;
        this.prevTimeStamp = timeStamp;
        this.applyForces();
        for (let particle of this.particles) {
            particle.integrate(deltaT);
        }

        for (let x = 0; x <= this.w; x++) {
            this.particles[this.index(x, 0)].lockToOriginal();
            this.particles[this.index(x, this.h)].lockToOriginal();
        }

        this.enforceConstraints();

        for (let x = 0; x <= this.w; x++) {
            this.particles[this.index(x, 0)].lockToOriginal();
            this.particles[this.index(x, this.h)].lockToOriginal();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.sail.geometry.vertices[i].copy(this.particles[i].position);
        }
        // recalculate cloth normals
        this.sail.geometry.computeFaceNormals();
        this.sail.geometry.computeVertexNormals();
        this.sail.geometry.normalsNeedUpdate = true;
        this.sail.geometry.verticesNeedUpdate = true;
    }

    enforceConstraints() {
        // Enforce all constraints in the cloth.
        for (let constraint of this.constraints) {
            constraint.enforce();
        }
    }
}

export default Sail;
