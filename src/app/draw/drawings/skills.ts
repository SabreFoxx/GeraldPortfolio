import { DrawComponent } from '../draw.component';
import { Drawing, showLine } from '../draw-utility.service';
import { BoxGeometry, MeshBasicMaterial, Geometry, Vector3, Raycaster, Object3D } from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

const MORPH_SPEED = 0.05;

class CollisionHandler {
    squeezeSpeed: number;
    object: MovableObject;
    objectPartner: MovableObject;
    isBeingSqueezed: boolean;
    isBeingUnsqueezed: boolean;
    morphSpeed: number;
    currentMorphWeight: number;
    directionDuringCollision: number; // +-1
    completelyBlockCollision: boolean = false;
    timeout: NodeJS.Timeout; // A central setTimeout object, so we won't create many and cause side-effect timing bugs

    constructor(object: MovableObject, objectPartner: MovableObject) {
        this.object = object;
        this.objectPartner = objectPartner;
        this.morphSpeed = MORPH_SPEED;
        this.timeout = setTimeout(() => {}, 0);
    }

    squeeze() {
        this.currentMorphWeight = (this.object.object.children[0] as any).morphTargetInfluences[0];
        if (this.isBeingSqueezed) {
            // Calculate morph weights
            this.currentMorphWeight += this.morphSpeed;
            if (this.currentMorphWeight > 1) this.currentMorphWeight = 1;
            this.shape();
            if (this.currentMorphWeight === 1) {
                this.isBeingSqueezed = false;
                this.isBeingUnsqueezed = true;
            }
        } else if (this.isBeingUnsqueezed) {
            this.currentMorphWeight -= this.morphSpeed;
            if (this.currentMorphWeight < 0) this.currentMorphWeight = 0;
            this.shape();
            if (this.currentMorphWeight === 0) {
                this.isBeingUnsqueezed = false;
            }
        }
    }

    /**
     * Applies shape based on morph weight
     */
    shape() {
        (this.object.object.children[0] as any).morphTargetInfluences[0] = this.currentMorphWeight;
        (this.object.object.children[1] as any).morphTargetInfluences[0] = this.currentMorphWeight;
        (this.objectPartner.object.children[0] as any).morphTargetInfluences[1] = this.currentMorphWeight;
        (this.objectPartner.object.children[1] as any).morphTargetInfluences[1] = this.currentMorphWeight;
    }

    /**
     * Makes collided objects go away from each other
     */
    bounceObjects() {
        // This is necessary so we won't have double collisions, which will switch travel direction
        // a second time, swiftly, and prevent the plates from travelling the proper direction
        this.completelyBlockCollision = true;

        // However, enable it after a second in case the object comes close to the other for long,
        // If the collision is off, it will eventually enter the other object
        window.clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.completelyBlockCollision = false;
        }, 1000);
        // NOTE: We are not creating a new setTimeout, but intead resetting an already created
        // one. We do not want many setTimeout's to be out there, ready to cause bugs for us.

        // The other plate, and only it, can detect collision
        this.objectPartner.collisionHandler.completelyBlockCollision = false;

        // Reverse their directions
        this.object.changeCourse(-1 * this.directionDuringCollision, getPrincipledSpeed());
        this.objectPartner.changeCourse(this.directionDuringCollision, getPrincipledSpeed());
    }
}

class MovableObject {
    objectName: string;
    object: Object3D;
    originalAngle: number; // in radians
    rotationSpeed: number;
    direction: number; // +-1
    canCollide: boolean;
    collisionHandler: CollisionHandler;
    errorRangeForOrigin: number = 0.04;

    static allCollisionHandlers: CollisionHandler[] = new Array;

    // Collision vector helpers
    private tail = new Vector3;
    private head = new Vector3;
    private threeDRayPositionHelpers: Object3D[]; // Helps us calculate head and tail, by pointing where there are
    private ray: Raycaster;
    private rayDirection: Vector3;

    constructor(name: string, object: Object3D) {
        this.objectName = name;
        this.object = object;
        this.originalAngle = object.rotation.z;
        this.direction = (() => { if (Math.random() > 0.5) return -1; else return 1; })();
        this.rotationSpeed = getPrincipledSpeed();
        this.ray = new Raycaster;
        this.ray.near = 0.0;
        this.ray.far = 1.7;
        this.rayDirection = new Vector3;
    }

    /**
     * Steps the animation once called
     */
    move() {
        if (this.isCollided()) this.startSqueezing();
        // The if block below, is a special operation for circles only, which don't collide
        if (!this.canCollide && bIsInRangeOfa(this.originalAngle, this.object.rotation.z, this.errorRangeForOrigin)) {
            // Disable error range, so that animation direction can change smoothly without hinderance
            this.errorRangeForOrigin = 0.0;
            // Re-enable after milliseconds
            setTimeout(() => {
                this.errorRangeForOrigin = 0.05;
            }, 200);
            if (Math.random() > 0.3) this.changeCourse();
        }
        this.rotate();
    }

    /**
     * When called, it will be known this object and its partner needs the squeezing animation
     */
    startSqueezing() {
        if (!this.collisionHandler.isBeingSqueezed && !this.collisionHandler.isBeingUnsqueezed)
            this.collisionHandler.isBeingSqueezed = true;
        this.collisionHandler.bounceObjects();
    }

    /**
     * Changes the direction and speed of object rotation
     * @param direction specify direction (optional)
     * @param speed specify speed (optional)
     */
    changeCourse(direction?: number, speed?: number) {
        if (direction !== undefined && speed !== undefined) {
            this.direction = direction;
            this.rotationSpeed = speed;
        } else {
            this.direction *= -1; // reverse the current direction
            this.rotationSpeed = getPrincipledSpeed(); // change speed
        }
    }

    /**
     * Pepares this object for collision detection
     * @param canCollide can this object detect collision?
     * @param objectCanCollideTo what object can it collide with?
     */
    setCollidable(canCollide: boolean, objectCanCollideTo: MovableObject): MovableObject {
        this.canCollide = canCollide;
        if (canCollide) {
            this.collisionHandler = new CollisionHandler(this, objectCanCollideTo);
            MovableObject.allCollisionHandlers.push(this.collisionHandler);
            this.threeDRayPositionHelpers = new Array;
            this.threeDRayPositionHelpers[0] = this.object.getObjectByName(this.objectName + "_raycast_helper_t");
            this.threeDRayPositionHelpers[1] = this.object.getObjectByName(this.objectName + "_raycast_helper_h");
            return this;
        }
        return undefined;
    }

    /**
     * Returns true if collided with partner
     */
    isCollided(): boolean {
        if (!this.canCollide)
            return false;

        //  We don't want multiple trues, so the last operation will go smoothly
        if (this.collisionHandler.completelyBlockCollision) {
            return false;
        } else {
            // Set head and tail vectors by using helpers
            this.threeDRayPositionHelpers[0].getWorldPosition(this.tail);
            this.threeDRayPositionHelpers[1].getWorldPosition(this.head);
            // Get direction, by taking difference of two vectors
            this.rayDirection.subVectors(this.head, this.tail).normalize();
            this.ray.set(this.tail, this.rayDirection);
            let result = this.ray.intersectObject(this.collisionHandler.objectPartner.object, true);

            // return result
            if (result.length > 0) {
                this.collisionHandler.directionDuringCollision = this.direction;
                return true;
            }
            else
                return false;
        }
    }

    rotate() {
        this.object.rotateZ(this.direction * this.rotationSpeed);
    }
}

export class SkillsDrawing implements Drawing {
    base: DrawComponent;

    geometry: Geometry;
    material: MeshBasicMaterial;
    sceneLoaded: Promise<boolean>;
    movableObjects: MovableObject[];

    constructor() { }

    setup(base: DrawComponent) {
        this.base = base;
        this.movableObjects = new Array;

        this.geometry = new BoxGeometry();
        this.material = new MeshBasicMaterial({ color: 0x00ff00 });
        base.camera.position.z = 5;

        let loader = new GLTFLoader();
        this.sceneLoaded = new Promise((resolve, reject) => {
            loader.load('assets/drawable/round.glb', (gltf: GLTF) => {
                gltf.scene.name = "primary";
                this.base.scene.add(gltf.scene);
                resolve(true);
            }, undefined, error => {
                console.error(error);
                reject(false);
            });
        });

        // Setup animation and collision
        this.sceneLoaded.then(res => {
            let all = this.base.scene.getObjectByName("primary");
            this.movableObjects.push(new MovableObject("center1", all.getObjectByName("center1")));
            this.movableObjects.push(new MovableObject("center2", all.getObjectByName("center2")));
            this.movableObjects.push(new MovableObject("center3", all.getObjectByName("center3")));

            let glsl = new MovableObject("glsl", all.getObjectByName("glsl_bg"));
            let scss = new MovableObject("scss", all.getObjectByName("scss_bg"));
            let typescript = new MovableObject("typescript", all.getObjectByName("typescript_bg"));
            let sql = new MovableObject("sql", all.getObjectByName("sql_bg"));
            let javascript = new MovableObject("javascript", all.getObjectByName("javascript_bg"));
            let cpp = new MovableObject("cpp", all.getObjectByName("cpp_bg"));

            this.movableObjects.push(glsl.setCollidable(true, scss));
            this.movableObjects.push(scss.setCollidable(true, glsl));
            this.movableObjects.push(typescript.setCollidable(true, sql));
            this.movableObjects.push(sql.setCollidable(true, typescript));
            this.movableObjects.push(javascript.setCollidable(true, cpp));
            this.movableObjects.push(cpp.setCollidable(true, javascript));
        });

        // (window as any).initFpsStats(); // Init fps stats. See assets/scripts/use_stats.js
    }

    draw() {
        // Animate only after scene setup is complete
        this.sceneLoaded.then(res => { this.animate() });
    }

    animate = () => {
        this.base.renderer.clear();
        requestAnimationFrame(this.animate);
        // (window as any).stats.update(); // Required, so our stats object can update itself. See assets/scripts/use_stats.js

        this.movableObjects.forEach(m => m.move());
        MovableObject.allCollisionHandlers.forEach(c => c.squeeze());

        // We out commented the below, since we won't be calling render(), since we're using a
        // post process workflow. We will use the render() method of an EffectComposer instead
        // this.base.renderer.render(this.base.scene, this.base.camera); // we won't be using this again
        this.base.composer.render();
    };
}

/**
 * Returns a speed that is not too fast, and not too slow
 */
function getPrincipledSpeed(): number {
    // Set min and max speeds
    // Too fast or too slow, and the direction change may fail on collision detection
    return random(0.007, 0.017);
}

function random(min, max) {
    return min + Math.random() * (max - min);
}

// Also works in scenarios where the number will increase to 3,
// and from there progress forward to -1 i.e, the number line is circular
function bIsInRangeOfa(a: number, b: number, range: number): boolean {
    range = Math.abs(range);
    a = Math.abs(a);
    b = Math.abs(b);
    return (b > -range + a) && (b < range + a);
}