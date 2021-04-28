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

    handleBoxCollision(bbox) {
        const friction = .9;
        let boundingBox = bbox.clone();
        if (boundingBox.containsPoint(this.position)) {
            let min = boundingBox.min;
            let max = boundingBox.max;
            let distToXYNeg = Math.abs(min.z - this.position.z);
            let distToXYPos = Math.abs(max.z - this.position.z);
            let distToYZNeg = Math.abs(min.x - this.position.x);
            let distToYZPos = Math.abs(max.x - this.position.x);
            let distToZXNeg = Math.abs(min.y - this.position.y);
            let distToZXPos = Math.abs(max.y - this.position.y);
            let minDist = Math.min(distToXYNeg, distToYZNeg, distToZXNeg, distToXYPos, distToYZPos, distToZXPos);
            let posNoFriction;
            if (minDist == distToXYNeg) {
                posNoFriction = new THREE.Vector3(this.position.x, this.position.y, min.z);
            } else if (minDist == distToXYPos) {
                posNoFriction = new THREE.Vector3(this.position.x, this.position.y, max.z);
            } else if (minDist == distToYZNeg) {
                posNoFriction = new THREE.Vector3(min.x, this.position.y, this.position.z);
            } else if (minDist == distToYZPos) {
                posNoFriction = new THREE.Vector3(max.x, this.position.y, this.position.z);
            } else if (minDist == distToZXNeg) {
                posNoFriction = new THREE.Vector3(this.position.x, min.y, this.position.z);
            } else {
                posNoFriction = new THREE.Vector3(this.position.x, max.y, this.position.z);
            }

            if (boundingBox.containsPoint(this.previous)) {
                this.position = posNoFriction;
            } else {
                let posFriction = this.previous.clone();
                this.position = posFriction.multiplyScalar(friction).add(posNoFriction.multiplyScalar(1 - friction));
            }
        }
    };
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

    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.prevTimeStamp = 0;

        // Resting Distances
        let fabricLength = 8;
        this.fabricLength = fabricLength;
        let rs = .25;
        this.riggingSize = rs;
        this.restDistance = 1; // for adjacent particles
        this.restDistanceB = 2; // multiplier for 2-away particles
        this.restDistanceS = Math.sqrt(2);
        this.particleMass = 0.1;
        this.gravity = 10;

        // Width and height
        let w = Math.round(this.fabricLength / this.restDistance);
        let h = Math.round(this.fabricLength / this.restDistance);
        this.w = w;
        this.h = h;
        this.parent = parent;
        this.scene = parent.scene;
        let sailOffset = 4;
        this.getInitPosition = function (u, v, vec) {
            let x = u * fabricLength - fabricLength / 2;
            let y = v * fabricLength + sailOffset;
            let z = 2 * rs;
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
        let mastHeight = this.fabricLength + sailOffset + rs / 2;
        mast.geometry = new THREE.BoxGeometry(rs, mastHeight, rs);
        mast.geometry.translate(0, mastHeight / 2, 0);
        mast.geometry.computeBoundingBox();
        mast.bbox = mast.geometry.boundingBox;
        mast.material = new THREE.MeshStandardMaterial({ color: 0x603913 });
        mast.mesh = new THREE.Mesh(mast.geometry, mast.material);
        this.mast = mast;

        let boom1 = {};
        boom1.geometry = new THREE.BoxGeometry(this.fabricLength, rs, rs);
        boom1.geometry.translate(0, sailOffset, rs);
        boom1.material = new THREE.MeshStandardMaterial({ color: 0x603913 });
        boom1.mesh = new THREE.Mesh(boom1.geometry, boom1.material);
        boom1.geometry.computeBoundingBox();
        boom1.bbox = boom1.geometry.boundingBox;

        let boom2 = {};
        boom2.geometry = new THREE.BoxGeometry(this.fabricLength, rs, rs);
        boom2.geometry.translate(0, sailOffset + this.fabricLength, rs);
        boom2.material = new THREE.MeshStandardMaterial({ color: 0x603913 });
        boom2.mesh = new THREE.Mesh(boom2.geometry, boom2.material);
        boom2.geometry.computeBoundingBox();
        boom2.bbox = boom2.geometry.boundingBox;
        this.boom1 = boom1;
        this.boom2 = boom2;

        this.add(this.sail.mesh);
        this.add(this.mast.mesh);
        this.add(this.boom1.mesh);
        this.add(this.boom2.mesh);

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
        parent.attach(this);
    }

    applyForces() {
        this.applyGravity();
        this.applyWind();
    }

    applyWind() {
        let windForce = this.scene.state.windDirection.applyEuler(this.parent.rotation).normalize().multiplyScalar(this.scene.state.windSpeed);

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

    handleCollisions() {
        let bbox = this.mast.bbox.clone().union(this.boom1.bbox);
        bbox.min.z = Number.NEGATIVE_INFINITY;
        for (let particle of this.particles) {
            particle.handleBoxCollision(bbox);
        }
    }

    update(timeStamp) {
        let deltaT = (timeStamp - this.prevTimeStamp) / 1000;
        this.prevTimeStamp = timeStamp;

        this.applyForces();
        for (let particle of this.particles) {
            particle.integrate(deltaT);
        }

        this.handleCollisions();

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

        this.handleCollisions();

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
