// ---------- helpers ----------
const boxGeo = new THREE.BoxGeometry(1,1,1);
function mat(color, opts={}){ const {rough,...rest}=opts; return new THREE.MeshStandardMaterial({ color, roughness: rough??0.9, metalness:0, ...rest }); }
const ROOF_PALETTE = [0xc1503a, 0xb0553c, 0xa0522d, 0x8b6f47, 0x6d7a8c, 0x9c4a5a];

// ---------- casita (pod) con estandarte de namespace ----------
function buildHouse(pod){
  const rng = makeRng(hashStr(pod.name+":"+pod.port));
  const g = new THREE.Group();
  g.userData.pod = pod;

  const wallColors=[0xe9dcc0,0xf0e2c4,0xdcc9a0,0xe6d2b0];
  const wallColor=wallColors[Math.floor(rng()*wallColors.length)];
  const roofColor=ROOF_PALETTE[Math.floor(rng()*ROOF_PALETTE.length)];
  const w=1.4+rng()*0.8, d=1.4+rng()*0.8;
  const storeys=rng()<0.3?2:1, storeyH=1.1+rng()*0.3, totalH=storeys*storeyH;
  const roofType=rng()<0.5?"gable":"hip";
  const hasChimney=rng()<0.8;

  const wallMat=mat(wallColor), roofMat=mat(roofColor,{rough:0.8}), woodMat=mat(0x7a5230);

  const body=new THREE.Mesh(boxGeo, wallMat);
  body.scale.set(w,totalH,d); body.position.y=totalH/2; body.castShadow=true; body.receiveShadow=true; g.add(body);

  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
    const beam=new THREE.Mesh(boxGeo, woodMat); beam.scale.set(0.12,totalH,0.12);
    beam.position.set(sx*w/2,totalH/2,sz*d/2); beam.castShadow=true; g.add(beam);
  });

  const roofH=0.7+rng()*0.5;
  let roofApexY;
  if(roofType==="gable"){
    const prism=makeGableRoof(w+0.3,d+0.3,roofH); prism.material=roofMat;
    prism.position.y=totalH+roofH/2; prism.castShadow=true; g.add(prism);
    roofApexY=totalH+roofH;
  } else {
    const hip=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.72,roofH+0.3,4), roofMat);
    hip.rotation.y=Math.PI/4; hip.position.y=totalH+(roofH+0.3)/2; hip.castShadow=true; g.add(hip);
    roofApexY=totalH+roofH+0.3;
  }

  if(hasChimney){
    const chim=new THREE.Mesh(boxGeo, mat(0x8a5a2a)); chim.scale.set(0.3,0.8,0.3);
    chim.position.set(w*0.25*(rng()<0.5?-1:1), totalH+roofH*0.5, d*0.2); chim.castShadow=true; g.add(chim);
  }

  const door=new THREE.Mesh(boxGeo, woodMat); door.scale.set(0.4,0.7,0.06); door.position.set(0,0.35,d/2+0.01); g.add(door);
  const win=new THREE.Mesh(boxGeo, mat(0xfff2b0)); win.scale.set(0.38,0.38,0.06); win.position.set(w*0.28,totalH*0.55,d/2+0.01); g.add(win);

  // ---- estandarte del namespace en el tejado ----
  const nsColor = NAMESPACES[pod.ns] ?? 0x888888;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.1,6), mat(0x5c3a21));
  pole.position.set(0, roofApexY+0.55, 0); g.add(pole);
  const flag=new THREE.Mesh(boxGeo, mat(nsColor, { rough:0.6 }));
  flag.scale.set(0.7,0.42,0.05); flag.position.set(0.38, roofApexY+0.85, 0);
  flag.userData.isFlag=true; g.add(flag);

  g.userData.footprint=Math.max(w,d);
  // etiqueta flotante con el nombre del pod
  const nameTag = makePodLabel(pod.name, nsColor);
  nameTag.position.set(0, roofApexY + 1.7, 0);
  nameTag.userData.isPodLabel = true;
  g.add(nameTag);
  g.userData.nameTag = nameTag;
  // marcar todo el grupo como clicable -> pod
  g.traverse(o=>{ if(o.isMesh) o.userData.pick = { type:"pod", pod }; });
  return g;
}

// etiqueta pequeña (sprite) con el nombre del pod
function makePodLabel(text, nsColor){
  const c=document.createElement('canvas'); c.width=256; c.height=56; const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(47,59,42,0.86)'; roundRect(ctx,6,6,244,44,12); ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle='#'+ (nsColor).toString(16).padStart(6,'0'); roundRect(ctx,6,6,244,44,12); ctx.stroke();
  ctx.font='bold 26px "Baloo 2", sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, 128, 30);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthTest:true }));
  spr.scale.set(3.2, 0.7, 1);
  return spr;
}

function makeGableRoof(w,d,h){
  const geo=new THREE.BufferGeometry(); const hw=w/2,hd=d/2,hh=h/2;
  const v=[-hw,-hh,hd, hw,-hh,hd, 0,hh,hd, -hw,-hh,-hd, hw,-hh,-hd, 0,hh,-hd];
  const idx=[0,1,2, 3,5,4, 0,2,5,0,5,3, 1,4,5,1,5,2, 0,3,4,0,4,1];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v,3)); geo.setIndex(idx); geo.computeVertexNormals();
  return new THREE.Mesh(geo);
}

// ---------- namespace: agrupar pods ----------
function groupByNamespace(pods){
  const map = new Map();
  pods.forEach(p=>{ if(!map.has(p.ns)) map.set(p.ns, []); map.get(p.ns).push(p); });
  return [...map.entries()]; // [ [ns, pods[]], ... ]
}

// tamaño (lado) que ocupa un grupo de namespace segun nº de pods
const CELL = 3.6;
function nsBlockSize(count){
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  return { cols, side: cols*CELL };
}

// ---------- nodo: parcela + muralla + bloques de namespace ----------
const WALL_H=2.4, WALL_T=0.7;
const NS_GAP=1.8;      // separacion entre bloques de namespace
const EDGE=2.6;        // margen bloque-muralla

const nodeGroups=[];

function buildNode(node){
  const g=new THREE.Group(); g.userData.node=node;
  const rng=makeRng(hashStr(node.name));

  const groups = groupByNamespace(node.pods);
  // disponer los bloques de namespace en una retícula
  const blocks = groups.map(([ns,pods])=>{ const s=nsBlockSize(pods.length); return { ns, pods, ...s }; });
  const gcols = Math.max(1, Math.ceil(Math.sqrt(blocks.length)));
  // ancho de cada columna/fila de bloques (usamos el mayor para uniformar la retícula)
  const maxSide = Math.max(...blocks.map(b=>b.side));
  const gridSide = gcols*maxSide + (gcols-1)*NS_GAP;
  const PLOT = gridSide + EDGE*2;
  const half = PLOT/2;
  g.userData.plot = PLOT;

  // cesped + tierra
  const grass=new THREE.Mesh(boxGeo, mat(0x5d9c3a)); grass.scale.set(PLOT,1,PLOT); grass.position.y=-0.5; grass.receiveShadow=true; grass.userData.pick={type:"node", node}; g.add(grass);
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
    for(let i=0;i<count;i++){ const off=start+i*step;
      if(Math.abs(off) < gapWidth/2) continue;   // hueco central (sobre el porton)
      const m=new THREE.Mesh(boxGeo, wallMat);
      if(horizontal){ m.scale.set(mW,0.6,WALL_T); m.position.set(off,WALL_H+0.3,0);} else { m.scale.set(WALL_T,0.6,mW); m.position.set(0,WALL_H+0.3,off);} m.castShadow=true; seg.add(m); }
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
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;const m=new THREE.Mesh(boxGeo,wallMat);m.scale.set(0.32,0.5,0.32);m.position.set(Math.cos(a)*0.95,WALL_H+1.2,Math.sin(a)*0.95);tower.add(m);}
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
    [[0,-hs,true],[0,hs,true],[-hs,0,false],[hs,0,false]].forEach(([ox,oz,horiz])=>{
      const seg=new THREE.Mesh(boxGeo, fenceMat);
      if(horiz) seg.scale.set(s,fh,ft); else seg.scale.set(ft,fh,s);
      seg.position.set(centerX+ox, fh/2, centerZ+oz); seg.castShadow=true; seg.userData.pick=nsPick; g.add(seg);
    });
    // postes en esquinas del murete
    [[-hs,-hs],[hs,-hs],[-hs,hs],[hs,hs]].forEach(([ox,oz])=>{
      const post=new THREE.Mesh(boxGeo, mat(0x5c3a21)); post.scale.set(0.28,fh+0.25,0.28);
      post.position.set(centerX+ox, (fh+0.25)/2, centerZ+oz); post.castShadow=true; g.add(post);
    });

    // cartel de madera con el nombre del namespace
    const sign = makeSign(b.ns, nsColor);
    sign.position.set(centerX - 1.25, 0.12, centerZ - hs - 0.3);
    g.add(sign);

    // casitas del bloque en reticula interna
    const cols=b.cols, innerStart=-(cols-1)*CELL/2;
    b.pods.forEach((pod,i)=>{
      const cx=i%cols, cz=Math.floor(i/cols);
      const house=buildHouse(pod);
      house.position.set(centerX + innerStart + cx*CELL + (rng()-0.5)*0.3, 0.12,
                         centerZ + innerStart + cz*CELL + (rng()-0.5)*0.3);
      house.rotation.y=(rng()-0.5)*0.4;
      g.add(house);
    });
  });

  return g;
}

// cartel de madera colgante (poste al lado, placa colgando de un brazo)
function makeSign(text, color){
  const grp=new THREE.Group();
  const woodMat=mat(0x6b4423);

  // poste vertical a la izquierda de la placa
  const postX = -1.5;
  const post=new THREE.Mesh(boxGeo, woodMat);
  post.scale.set(0.18, 3.2, 0.18); post.position.set(postX, 1.6, 0); post.castShadow=true; grp.add(post);
  // remate del poste
  const cap=new THREE.Mesh(boxGeo, woodMat); cap.scale.set(0.3,0.2,0.3); cap.position.set(postX, 3.3, 0); grp.add(cap);
  // brazo horizontal del que cuelga la placa
  const arm=new THREE.Mesh(boxGeo, woodMat); arm.scale.set(2.1,0.16,0.16); arm.position.set(postX+1.05, 3.0, 0); arm.castShadow=true; grp.add(arm);
  // cadenitas/soportes
  [postX+0.55, postX+1.95].forEach(x=>{ const link=new THREE.Mesh(boxGeo, woodMat); link.scale.set(0.05,0.35,0.05); link.position.set(x, 2.75, 0); grp.add(link); });

  // placa
  const c=document.createElement('canvas'); c.width=300; c.height=96; const ctx=c.getContext('2d');
  ctx.fillStyle='#e8d8b0'; roundRect(ctx,4,4,292,88,12); ctx.fill();
  ctx.lineWidth=7; ctx.strokeStyle='#'+color.toString(16).padStart(6,'0'); roundRect(ctx,4,4,292,88,12); ctx.stroke();
  ctx.font='bold 34px "Baloo 2", sans-serif'; ctx.fillStyle='#3a2a15'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, 150, 50);
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.83), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, side:THREE.DoubleSide }));
  plaque.position.set(postX+1.25, 2.3, 0.02); grp.add(plaque);
  return grp;
}
