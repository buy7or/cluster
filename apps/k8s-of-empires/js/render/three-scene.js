// ---------- three.js ----------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86cbe8);
scene.fog = new THREE.Fog(0x86cbe8, 80, 200);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 700);
let camDist = 80, camYaw = 0.62, camPitch = 0.72;
const camTarget = new THREE.Vector3(0, 1, 0);
// destinos animados (para el doble-click)
let tweenDist = camDist;
const tweenTarget = camTarget.clone();
let tweening = false;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

// luz: ambiente bajo + sol fuerte = color saturado y sombras con presencia
scene.add(new THREE.HemisphereLight(0xbfe6ff, 0x4a7a2a, 0.42));
const sun = new THREE.DirectionalLight(0xfff4d6, 1.45);
sun.position.set(34, 50, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left:-100, right:100, top:100, bottom:-100, near:1, far:220 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 2.5;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.14);
fill.position.set(-28, 20, -18);
scene.add(fill);
