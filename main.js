import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202030);

///// Loading the 3D model \\\\\\
let map;
loader.load("./Models/tempMap/scene.gltf", (gltf) => {
    map = gltf.scene;
    map.position.set(1, -1, -1);
    scene.add(map);
});

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);


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

        this.mesh.scale.set(1, 1.3, 1);
        this.mesh.position.set(0, 0, 0)
        this.mesh.rotation.set(0, 0, 0);
        scene.add(this.mesh);
    }

    update(keys, deltaTime) {
        const distance = this.speed * deltaTime;

        if (keys.w) this.mesh.position.z -= distance;
        if (keys.s) this.mesh.position.z += distance;
        if (keys.a) this.mesh.position.x -= distance;
        if (keys.d) this.mesh.position.x += distance;
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

    player.update(keys, deltaTime);
    renderer.render(scene, camera);

    camera.position.set(player.mesh.position.x, player.mesh.position.y + 1.5, player.mesh.position.z + 3);
    camera.rotation.set(-0.2, 0, 0);
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