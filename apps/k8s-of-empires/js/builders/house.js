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
