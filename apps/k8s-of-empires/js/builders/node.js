// ---------- nodo: parcela + muralla + bloques de namespace ----------
const WALL_H=2.4, WALL_T=0.7;
const NS_GAP=1.8;      // separacion entre bloques de namespace
const EDGE=2.6;        // margen bloque-muralla
const EMPTY_NODE_SIDE=CELL;

function buildNode(node){
  const g=new THREE.Group(); g.userData.node=node;
  const rng=makeRng(hashStr(node.name));

  const groups = groupByNamespace(node.pods || []);
  // disponer los bloques de namespace en una retícula
  const blocks = groups.map(([ns,pods])=>{ const s=nsBlockSize(pods.length); return { ns, pods, ...s }; });
  const gcols = Math.max(1, Math.ceil(Math.sqrt(blocks.length)));
  // ancho de cada columna/fila de bloques (usamos el mayor para uniformar la retícula)
  const maxSide = blocks.length ? Math.max(...blocks.map(b=>b.side)) : EMPTY_NODE_SIDE;
  const gridSide = blocks.length ? gcols*maxSide + (gcols-1)*NS_GAP : EMPTY_NODE_SIDE;
  const PLOT = gridSide + EDGE*2;
  const half = PLOT/2;
  g.userData.plot = PLOT;

  // suelo de madera + tierra
  const woodFloor=new THREE.Mesh(boxGeo, makeWoodFloorMaterial(PLOT)); woodFloor.scale.set(PLOT,1,PLOT); woodFloor.position.y=-0.5; woodFloor.receiveShadow=true; woodFloor.userData.pick={type:"node", node}; g.add(woodFloor);
  const dirt=new THREE.Mesh(boxGeo, mat(0x8a6a3a)); dirt.scale.set(PLOT,4,PLOT); dirt.position.y=-3.0; dirt.receiveShadow=true; g.add(dirt);

  // muralla exterior
  const wallMat=mat(0xc2bcae,{rough:0.95});
  const DROP = 1.2;  // cuanto baja la muralla por debajo del cesped hasta el suelo del mundo
  function wallSegment(len,horizontal,gapWidth=0){
    const seg=new THREE.Group();
    const body=new THREE.Mesh(boxGeo, wallMat);
    const bh = WALL_H + DROP;                 // altura total (incluye la parte enterrada hasta el suelo)
    if(horizontal) body.scale.set(len,bh,WALL_T); else body.scale.set(WALL_T,bh,len);
    body.position.y = WALL_H/2 - DROP/2;      // centro desplazado hacia abajo
    body.castShadow=true; body.receiveShadow=true; seg.add(body);
    const mW=0.7,gap=0.5,step=mW+gap,count=Math.floor(len/step),start=-(count*step)/2+step/2;
    const merlons=[];
    for(let i=0;i<count;i++){ const off=start+i*step;
      if(Math.abs(off) < gapWidth/2) continue;   // hueco central (sobre el porton)
      merlons.push(horizontal
        ? {x:off,y:WALL_H+0.3,z:0,sx:mW,sy:0.6,sz:WALL_T}
        : {x:0,y:WALL_H+0.3,z:off,sx:WALL_T,sy:0.6,sz:mW});
    }
    if(merlons.length) seg.add(makeBoxInstances(wallMat, merlons));
    return seg;
  }
  const north=wallSegment(PLOT,true); north.position.set(0,0,-half);
  const south=wallSegment(PLOT,true,3.0); south.position.set(0,0,half);   // hueco para la puerta
  const west=wallSegment(PLOT,false); west.position.set(-half,0,0);
  const east=wallSegment(PLOT,false); east.position.set(half,0,0);
  g.add(north,south,west,east);

  // torres esquineras
  [[-half,-half],[half,-half],[-half,half],[half,half]].forEach(([x,z])=>{
    const tower=new THREE.Group();
    const th = WALL_H+1.2+DROP;               // torre extendida hasta el suelo
    const body=new THREE.Mesh(new THREE.CylinderGeometry(1,1.1,th,10), wallMat);
    body.position.y=(WALL_H+1.2)/2 - DROP/2; body.castShadow=true; tower.add(body);
    const towerMerlons=Array.from({length:8},(_,i)=>{const a=(i/8)*Math.PI*2;return {
      x:Math.cos(a)*0.95,y:WALL_H+1.2,z:Math.sin(a)*0.95,sx:0.32,sy:0.5,sz:0.32
    };});
    tower.add(makeBoxInstances(wallMat,towerMerlons));
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.35,1.4,10), mat(0x8a5a4a)); roof.position.y=WALL_H+2.1; roof.castShadow=true; tower.add(roof);
    tower.position.set(x,0,z); g.add(tower);
  });

  // porton sur (extendido hasta el suelo)
  const gateH = WALL_H*0.8 + DROP;
  const gate=new THREE.Mesh(boxGeo, mat(0x6b4423)); gate.scale.set(2.2, gateH, WALL_T+0.15); gate.position.set(0, WALL_H*0.4 - DROP/2, half); g.add(gate);
  const arch=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,WALL_T+0.15,12,1,false,0,Math.PI), mat(0x6b4423));
  arch.rotation.z=Math.PI/2; arch.rotation.y=Math.PI/2; arch.position.set(0,WALL_H*0.8,half); g.add(arch);

  // marcador de piedra del nodo, junto al porton (apoyado en el suelo del mundo)
  const banner = makeNodeBanner(node);
  banner.position.set(-2.8, -0.98, half + 1.7);
  banner.traverse(o=>{ if(o.isMesh) o.userData.pick={type:"node", node}; });
  g.add(banner);

  // ---- bloques de namespace ----
  const housePlacements=[];
  const gridStart = -(gridSide/2) + maxSide/2;
  blocks.forEach((b, bi)=>{
    const bx = bi % gcols;
    const bz = Math.floor(bi / gcols);
    const centerX = gridStart + bx*(maxSide+NS_GAP);
    const centerZ = gridStart + bz*(maxSide+NS_GAP);
    const nsColor = NAMESPACES[b.ns] ?? 0x888888;

    const nsPick = { type:"namespace", ns:b.ns, node, count:b.pods.length };

    // suelo de color del namespace (adoquin)
    const pad=new THREE.Mesh(boxGeo, mat(nsColor,{rough:1, transparent:true, opacity:0.22}));
    pad.scale.set(b.side+0.6, 0.12, b.side+0.6);
    pad.position.set(centerX, 0.06, centerZ);
    pad.receiveShadow=true; pad.userData.pick=nsPick; g.add(pad);

    // murete bajo alrededor del bloque
    const fenceMat = mat(nsColor, { rough:0.8 });
    const fh=0.55, ft=0.18, s=b.side+0.6, hs=s/2;
    const fences=makeBoxInstances(fenceMat, [[0,-hs,true],[0,hs,true],[-hs,0,false],[hs,0,false]].map(([ox,oz,horiz])=>({
      x:centerX+ox,y:fh/2,z:centerZ+oz,sx:horiz?s:ft,sy:fh,sz:horiz?ft:s
    })));
    fences.userData.pick=nsPick;
    g.add(fences);
    // postes en esquinas del murete
    g.add(makeBoxInstances(mat(0x5c3a21), [[-hs,-hs],[hs,-hs],[-hs,hs],[hs,hs]].map(([ox,oz])=>({
      x:centerX+ox,y:(fh+0.25)/2,z:centerZ+oz,sx:0.28,sy:fh+0.25,sz:0.28
    }))));

    // cartel de madera con el nombre del namespace
    const sign = makeSign(b.ns, nsColor);
    sign.position.set(centerX - 1.25, 0.12, centerZ - hs - 0.3);
    g.add(sign);

    // casitas del bloque en reticula interna
    const cols=b.cols, innerStart=-(cols-1)*CELL/2;
    b.pods.forEach((pod,i)=>{
      const cx=i%cols, cz=Math.floor(i/cols);
      housePlacements.push({
        pod,
        x:centerX+innerStart+cx*CELL+(rng()-0.5)*0.3,
        y:0.12,
        z:centerZ+innerStart+cz*CELL+(rng()-0.5)*0.3,
        rotation:(rng()-0.5)*0.4
      });
    });
  });

  g.add(buildHouseInstances(housePlacements));

  return g;
}
