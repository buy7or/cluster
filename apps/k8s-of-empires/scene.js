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

// ---------- isla: agua + orilla de arena + cesped ----------
const GROUND_MARGIN = 7;

// textura de cesped a baldosas suaves (estilo aldea)
function makeGrassTexture(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d');
  x.fillStyle='#5d9c3a'; x.fillRect(0,0,128,128);
  x.fillStyle='#60a13d'; x.fillRect(0,0,64,64); x.fillRect(64,64,64,64);
  for(let i=0;i<120;i++){
    x.fillStyle = i%2 ? 'rgba(80,138,50,0.35)' : 'rgba(108,168,72,0.3)';
    const px=Math.random()*128, py=Math.random()*128, s=1+Math.random()*3;
    x.fillRect(px,py,s,s);
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return t;
}
const grassTex = makeGrassTexture();

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(1400,1400),
  new THREE.MeshStandardMaterial({ color:0x2b8ec4, roughness:0.4, metalness:0.05 })
);
water.rotation.x=-Math.PI/2; water.position.y=-3.4; water.receiveShadow=true;
scene.add(water);

const sand = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({ color:0xdec98d, roughness:1 })
);
sand.receiveShadow=true; scene.add(sand);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1,1),
  new THREE.MeshStandardMaterial({ map:grassTex, roughness:1 })
);
ground.rotation.x=-Math.PI/2; ground.position.y=-0.98; ground.receiveShadow=true;
scene.add(ground);

const groundEdge = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({ color:0x7a5a2e, roughness:1 })
);
groundEdge.receiveShadow=true; scene.add(groundEdge);

function updateGround(){
  if(!nodeGroups.length) return;
  let minX=Infinity, maxX=-Infinity, maxPlot=0;
  nodeGroups.forEach(g=>{
    const half=g.userData.plot/2;
    minX=Math.min(minX, g.position.x-half);
    maxX=Math.max(maxX, g.position.x+half);
    maxPlot=Math.max(maxPlot, g.userData.plot);
  });
  const w = (maxX-minX) + GROUND_MARGIN*2;
  const d = maxPlot + GROUND_MARGIN*2;
  const cx = (minX+maxX)/2;

  ground.geometry.dispose();
  ground.geometry = new THREE.PlaneGeometry(w, d);
  ground.position.set(cx, -0.98, 0);
  grassTex.repeat.set(w/8, d/8);

  groundEdge.scale.set(w-0.8, 2.6, d-0.8);
  groundEdge.position.set(cx, -2.3, 0);

  sand.scale.set(w+7, 2.2, d+7);
  sand.position.set(cx, -2.6, 0);

  water.position.x = cx;

  const diag = Math.hypot(w,d);
  scene.fog.near = diag*0.9;
  scene.fog.far  = diag*2.6;

  decorateIsland(cx, w, d, maxPlot);
}

// decoracion de la isla: camino de tierra entre portones + vegetacion de borde
const islandDeco = new THREE.Group();
scene.add(islandDeco);

function decorateIsland(cx, w, d, maxPlot){
  while(islandDeco.children.length) islandDeco.remove(islandDeco.children[0]);
  const dr = makeRng(1337);
  const roadZ = maxPlot/2 + 4.2;      // delante de los portones
  const y = -0.96;

  // camino principal
  const road = new THREE.Mesh(new THREE.PlaneGeometry(w-4, 3.2), mat(0xa07d4d,{rough:1}));
  road.rotation.x=-Math.PI/2; road.position.set(cx, y, roadZ);
  road.receiveShadow=true; islandDeco.add(road);

  // ramales desde cada porton al camino
  nodeGroups.forEach(g=>{
    const half=g.userData.plot/2;
    const len = roadZ - half;
    if(len<=0.2) return;
    const spur=new THREE.Mesh(new THREE.PlaneGeometry(2.6, len), mat(0xa07d4d,{rough:1}));
    spur.rotation.x=-Math.PI/2;
    spur.position.set(g.position.x, y, half + len/2);
    spur.receiveShadow=true; islandDeco.add(spur);
  });

  // vegetacion ordenada por el borde de la isla
  function tree(x,z,s){
    const t=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,1.0,6), mat(0x6b4a24));
    trunk.position.y=0.5; trunk.castShadow=true; t.add(trunk);
    const g1=new THREE.Mesh(new THREE.ConeGeometry(1.0,1.8,8), mat(0x3f8a2c));
    g1.position.y=1.7; g1.castShadow=true; t.add(g1);
    const g2=new THREE.Mesh(new THREE.ConeGeometry(0.75,1.3,8), mat(0x4b9c36));
    g2.position.y=2.5; g2.castShadow=true; t.add(g2);
    t.position.set(x,-0.98,z); t.scale.setScalar(s);
    islandDeco.add(t);
  }
  function bush(x,z,s){
    const b=new THREE.Mesh(new THREE.IcosahedronGeometry(0.55,0), mat(0x4b9c36));
    b.position.set(x,-0.7,z); b.scale.set(s,s*0.8,s); b.rotation.y=dr()*3; b.castShadow=true;
    islandDeco.add(b);
  }
  function rock(x,z,s){
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(0.42,0), mat(0x96907f));
    r.position.set(x,-0.78,z); r.scale.set(s,s*0.7,s); r.rotation.set(dr(),dr(),dr()); r.castShadow=true;
    islandDeco.add(r);
  }

  const hw=w/2-2.4, hd=d/2-2.4;
  const stepX = 5.5;
  for(let x=-hw; x<=hw; x+=stepX){
    const jx=(dr()-0.5)*1.2;
    // borde norte
    const zN=-hd+(dr()-0.5)*1.0;
    if(dr()<0.62) tree(cx+x+jx, zN, 0.85+dr()*0.5); else bush(cx+x+jx, zN, 0.9+dr()*0.6);
    // borde sur (mas alla del camino)
    const zS=hd+(dr()-0.5)*1.0;
    if(zS > roadZ+1.6){
      if(dr()<0.55) tree(cx+x+jx, zS, 0.85+dr()*0.5); else rock(cx+x+jx, zS, 0.8+dr()*0.7);
    }
  }
  const stepZ = 5.0;
  for(let z=-hd+stepZ; z<hd-stepZ*0.5; z+=stepZ){
    if(Math.abs(z-roadZ)<2.6) continue;
    const jz=(dr()-0.5)*1.0;
    if(dr()<0.6) tree(cx-hw+(dr()-0.5)*0.9, z+jz, 0.85+dr()*0.5); else bush(cx-hw, z+jz, 0.9+dr()*0.5);
    if(dr()<0.6) tree(cx+hw+(dr()-0.5)*0.9, z+jz, 0.85+dr()*0.5); else rock(cx+hw, z+jz, 0.8+dr()*0.6);
  }
}
