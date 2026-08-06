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

// caminos de tierra entre los portones
const islandDeco = new THREE.Group();
scene.add(islandDeco);

function decorateIsland(cx, w, d, maxPlot){
  while(islandDeco.children.length) islandDeco.remove(islandDeco.children[0]);
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
}
