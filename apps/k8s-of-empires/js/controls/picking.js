// distinguir click de arrastre
let downX=0, downY=0, moved=false;
renderer.domElement.addEventListener('pointerdown', e=>{ downX=e.clientX; downY=e.clientY; moved=false; });
renderer.domElement.addEventListener('pointermove', e=>{ if(Math.hypot(e.clientX-downX, e.clientY-downY)>5) moved=true; });
renderer.domElement.addEventListener('pointerup', e=>{
  if(moved) return; // fue un arrastre de cámara
  mouse.x = (e.clientX/innerWidth)*2 - 1;
  mouse.y = -(e.clientY/innerHeight)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for(const h of hits){
    if(h.object.userData && h.object.userData.pick){ showScroll(h.object.userData.pick); return; }
  }
  hideScroll();
});

// doble click -> zoom suave hacia el elemento
renderer.domElement.addEventListener('dblclick', e=>{
  mouse.x = (e.clientX/innerWidth)*2 - 1;
  mouse.y = -(e.clientY/innerHeight)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  let focus = null, desiredDist = camDist;
  for(const h of hits){
    if(h.object.userData && h.object.userData.pick){
      const pick = h.object.userData.pick;
      // centro del elemento y distancia deseada segun tipo
      focus = h.point.clone();
      if(pick.type === "pod"){
        // centro real de la casita (grupo padre con userData.pod)
        let p=h.object; while(p.parent && !(p.userData && p.userData.pod)) p=p.parent;
        const c=new THREE.Vector3(); new THREE.Box3().setFromObject(p).getCenter(c); focus.copy(c);
        desiredDist = 16;
      } else if(pick.type === "namespace"){
        desiredDist = 30;
      } else if(pick.type === "node"){
        // centrar en el nodo entero
        const ng = nodeGroups.find(g=>g.userData.node===pick.node);
        if(ng){ const c=new THREE.Vector3(); new THREE.Box3().setFromObject(ng).getCenter(c); focus.copy(c); }
        desiredDist = Math.max(34, (pick.node.pods.length>6?52:40));
      }
      break;
    }
  }
  if(!focus){
    // doble click en vacio: usar punto del suelo
    const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    focus=new THREE.Vector3();
    if(!raycaster.ray.intersectPlane(plane,focus)) return;
    desiredDist = Math.max(28, camDist*0.6);
  }
  focus.y = Math.max(0, focus.y*0.4); // no meter la camara bajo el suelo
  tweenTarget.copy(focus);
  tweenDist = Math.max(16, Math.min(150, desiredDist));
  tweening = true;
});
