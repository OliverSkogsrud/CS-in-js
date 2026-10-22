import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


///// VARIABLES

const loader = new GLTFLoader();


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202030);

///// Loading the 3D model \\\\\\
let map;
const colliders = [];
const groundMeshes = [];

/////// CAMERA MOVEMENT

let yaw = 0;

let pitch = 0;




loader.load("./Models/tempMap/scene.gltf", (gltf) => {
    map = gltf.scene;
    map.position.set(2, -1, -2);
    scene.add(map);

    map.updateMatrixWorld(true);
    map.traverse((object) => {
        const name = object.name.toLowerCase();
        const isFloor = name.includes("floor") || name.includes("plane");

        if (object.isMesh && isFloor) {
            groundMeshes.push(object);
        }

        if (object.isMesh && !isFloor) {
            colliders.push(new THREE.Box3().setFromObject(object));
        }
    });
});

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,   
    0.1,
    100
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Player movement 

class Player {
    constructor() {
        this.speed = 3; // Units per second
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );

        this.mesh.scale.set(0.5, 0.55, 0.5);
        this.mesh.position.set(0, 0, 0)
        this.mesh.rotation.set(0, 0, 0);
        this.raycaster = new THREE.Raycaster();
        this.isOnGround = false;
        this.collider = new THREE.Sphere(new THREE.Vector3(), 0.25);
        scene.add(this.mesh);
    }

    collides(colliders) {
        this.collider.center.copy(this.mesh.position);

        return colliders.some((collider) => {
            return collider.intersectsSphere(this.collider);
        });
    }

    checkGround(groundMeshes) {
        const playerBox = new THREE.Box3().setFromObject(this.mesh);
        const rayStart = new THREE.Vector3(
            this.mesh.position.x,
            playerBox.min.y + 0.1,
            this.mesh.position.z
        );

        this.raycaster.set(rayStart, new THREE.Vector3(0, -1, 0));

        const hits = this.raycaster.intersectObjects(groundMeshes, true);
        this.isOnGround = hits.length > 0 && hits[0].distance <= 0.15;

        if (!this.isOnGround) {
            this.mesh.position.y -= 0.1; // Gravity effect
        }

    }

    move(x, z, colliders) {
        this.mesh.position.x += x;

        if (this.collides(colliders)) {
            this.mesh.position.x -= x;
        }

        this.mesh.position.z += z;

        if (this.collides(colliders)) {
            this.mesh.position.z -= z;
        }
    }

    update(keys, deltaTime, colliders, camera) {
        const distance = this.speed * deltaTime;
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const direction = new THREE.Vector3();

        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        if (keys.w) direction.add(forward);
        if (keys.s) direction.sub(forward);
        if (keys.d) direction.add(right);
        if (keys.a) direction.sub(right);

        if (direction.lengthSq() > 0) {
            direction.normalize();
            this.move(direction.x * distance, direction.z * distance, colliders);
        }
    }
}
    
const player = new Player();
const keys = {};
let previousTime;


scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 2));

function animate(currentTime) {
    requestAnimationFrame(animate);

    const deltaTime = previousTime === undefined ? 0 : (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    player.update(keys, deltaTime, colliders, camera);
    player.checkGround(groundMeshes);
    renderer.render(scene, camera);

    camera.position.set(
        player.mesh.position.x, 
        player.mesh.position.y, 
        player.mesh.position.z
    );
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});








//////MOVEMENT CONTROLS//////

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if ("wasd".includes(key)) {
        keys[key] = true;
    }
});

window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if ("wasd".includes(key)) {
        keys[key] = false;
    }
});

window.addEventListener("blur", () => {
    Object.keys(keys).forEach((key) => {
        keys[key] = false;
    });
});


///// CAMERA CONTROL

renderer.domElement.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    const sensetivity = 0.002;

    yaw -= event.movementX * sensetivity;
    pitch -= event.movementY * sensetivity;

    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    camera.rotation.set(pitch, yaw, 0);
        
});