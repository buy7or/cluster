// ---------- layout global ----------
function layoutNodes(){
  const gaps=10;
  const totalW = nodeGroups.reduce((a,g)=>a+g.userData.plot,0) + gaps*(nodeGroups.length-1);
  let x=-totalW/2;
  nodeGroups.forEach(g=>{
    const w=g.userData.plot; g.position.x=x+w/2; x+=w+gaps;
  });
  updateGround();
}

function rebuildWorld(){
  nodeGroups.forEach(g=>scene.remove(g));
  scene.children.filter(c=>c.isSprite).forEach(s=>scene.remove(s));
  nodeGroups.length=0;
  nodeData.forEach(node=>{
    const g=buildNode(node); scene.add(g); nodeGroups.push(g);
  });
  layoutNodes();
  renderLegend();
  const sc=document.getElementById('scroll'); if(sc) sc.classList.remove('show');
}

// marcador del nodo: piedra tallada estilo heraldico con estandarte colgante
function makeNodeBanner(node){
  const grp=new THREE.Group();
  const stoneMat=mat(0xb4ada0,{rough:1});
  const stoneDark=mat(0x9a9184,{rough:1});

  // base de piedra escalonada
  const base=new THREE.Mesh(boxGeo, stoneDark); base.scale.set(2.0,0.4,1.0); base.position.y=0.2; base.castShadow=true; base.receiveShadow=true; grp.add(base);
  const base2=new THREE.Mesh(boxGeo, stoneMat); base2.scale.set(1.6,0.35,0.8); base2.position.y=0.55; base2.castShadow=true; grp.add(base2);

  // losa vertical tallada (menhir)
  const slab=new THREE.Mesh(boxGeo, stoneMat); slab.scale.set(1.5,2.6,0.42); slab.position.y=2.0; slab.castShadow=true; slab.receiveShadow=true; grp.add(slab);
  // remate superior redondeado
  const capTop=new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.75,0.42,16,1,false,0,Math.PI), stoneMat);
  capTop.rotation.z=-Math.PI/2; capTop.rotation.y=Math.PI/2; capTop.position.set(0,3.3,0); capTop.castShadow=true; grp.add(capTop);

  // placa tallada (texto grabado en la piedra)
  const c=document.createElement('canvas'); c.width=256; c.height=320; const ctx=c.getContext('2d');
  ctx.clearRect(0,0,256,320);
  // fondo sutil grabado
  ctx.fillStyle='rgba(60,50,35,0.12)'; roundRect(ctx,30,90,196,150,16); ctx.fill();
  // texto vertical? no: nombre en horizontal, grande y grabado
  ctx.save();
  ctx.translate(128,165);
  ctx.font='bold 30px "Baloo 2", sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  // efecto grabado: sombra clara arriba, texto oscuro
  ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fillText(node.name, 0, -1.5);
  ctx.fillStyle='#4a4034'; ctx.fillText(node.name, 0, 0.5);
  ctx.restore();
  const tex=new THREE.CanvasTexture(c);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.4), new THREE.MeshBasicMaterial({ map:tex, transparent:true }));
  face.position.set(0,2.0,0.22); grp.add(face);
  const faceBack=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.4), new THREE.MeshBasicMaterial({ map:tex, transparent:true }));
  faceBack.position.set(0,2.0,-0.22); faceBack.rotation.y=Math.PI; grp.add(faceBack);

  // pequeño estandarte de tela en un lateral (toque medieval)
  const poleMat=mat(0x5c3a21);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.4,6), poleMat);
  pole.position.set(0.95,2.0,0); grp.add(pole);
  const cloth=new THREE.Mesh(boxGeo, mat(0xb3452f)); cloth.scale.set(0.55,0.7,0.04);
  cloth.position.set(1.28,2.55,0); grp.add(cloth);
  // pico del estandarte
  const notch=new THREE.Mesh(new THREE.ConeGeometry(0.28,0.35,3), mat(0xb3452f));
  notch.rotation.z=Math.PI; notch.position.set(1.28,2.1,0); notch.scale.set(1,1,0.1); grp.add(notch);

  return grp;
}
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

// leyenda de namespaces (solo los presentes)
function renderLegend(){
  const present = new Set(); nodeData.forEach(n=>n.pods.forEach(p=>present.add(p.ns)));
  const el=document.getElementById('legend');
  el.innerHTML='<div class="t">Namespaces</div>';
  NS_LIST.filter(ns=>present.has(ns)).forEach(ns=>{
    const hex='#'+NAMESPACES[ns].toString(16).padStart(6,'0');
    const row=document.createElement('div'); row.innerHTML=`<i style="background:${hex}"></i> ${ns}`; el.appendChild(row);
  });
}

rebuildWorld();
