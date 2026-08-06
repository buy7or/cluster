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
