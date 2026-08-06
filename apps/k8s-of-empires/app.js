// ---------- demo ----------
const chronicleEl=document.getElementById('chronicle'); let chronTimer=null;
function chronicle(t){ chronicleEl.textContent=t; chronicleEl.classList.add('show'); clearTimeout(chronTimer); chronTimer=setTimeout(()=>chronicleEl.classList.remove('show'),2800); }
function leastLoaded(){ return nodeData.reduce((a,b)=> b.pods.length<a.pods.length?b:a); }
function randomNs(){ return NS_LIST[Math.floor(Math.random()*NS_LIST.length)]; }

document.getElementById('addPod').onclick=()=>{
  const node=leastLoaded(); const ns=randomNs();
  const before=node.userData?node.userData.plot:0;
  node.pods.push(mkPod(null, ns)); rebuildWorld();
  chronicle(`Nuevo pod en ${node.name} · namespace ${ns} (${node.pods.length} pods)`);
};
document.getElementById('addToNode0').onclick=()=>{
  const node=nodeData[0]; const ns=randomNs();
  node.pods.push(mkPod(null, ns)); rebuildWorld();
  chronicle(`${node.name} crece · nuevo pod en ${ns} (${node.pods.length} pods)`);
};
document.getElementById('removePod').onclick=()=>{
  const withPods=nodeData.filter(n=>n.pods.length>0); if(!withPods.length)return;
  const node=withPods.reduce((a,b)=> b.pods.length>a.pods.length?b:a); const gone=node.pods.pop();
  rebuildWorld(); chronicle(`Se retira ${gone.name} de ${node.name} (${node.pods.length} pods)`);
};

// modos de nombres: "auto" (fade por distancia) | "all" | "off"
let nameMode = "auto";
document.getElementById('toggleNames').onclick=(e)=>{
  nameMode = nameMode==="auto" ? "all" : nameMode==="all" ? "off" : "auto";
  e.target.textContent = "Nombres: " + (nameMode==="auto"?"auto":nameMode==="all"?"todos":"ocultos");
};

// ---------- click -> pergamino de info ----------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const scrollEl = document.getElementById('scroll');

function hexStr(n){ return '#'+n.toString(16).padStart(6,'0'); }

function nsColorOf(pod){ return NAMESPACES[pod.ns] ?? 0x888888; }

function showScroll(pick){
  const kindEl=document.getElementById('scrollKind');
  const titleEl=document.getElementById('scrollTitle');
  const rowsEl=document.getElementById('scrollRows');
  rowsEl.innerHTML='';
  const row=(k,v)=>{ const d=document.createElement('div'); d.className='scroll-row'; d.innerHTML=`<span class="k">${k}</span><span class="v">${v}</span>`; rowsEl.appendChild(d); };

  if(pick.type==="pod"){
    const p=pick.pod;
    kindEl.innerHTML=`<span class="dot" style="background:${hexStr(nsColorOf(p))}"></span> Pod`;
    titleEl.textContent=p.name;
    row("Namespace", p.ns);
    row("Imagen", p.image || "—");
    row("Puerto", ":"+p.port);
    const node = nodeData.find(n=>n.pods.includes(p));
    row("Nodo", node?node.name:"—");
    row("Estado", "Running");
  } else if(pick.type==="namespace"){
    kindEl.innerHTML=`<span class="dot" style="background:${hexStr(NAMESPACES[pick.ns]??0x888888)}"></span> Namespace`;
    titleEl.textContent=pick.ns;
    row("En este nodo", pick.node.name);
    row("Pods aquí", pick.count);
    const total = nodeData.reduce((a,n)=>a+n.pods.filter(p=>p.ns===pick.ns).length,0);
    row("Pods en total", total);
    const nodesWith = nodeData.filter(n=>n.pods.some(p=>p.ns===pick.ns)).length;
    row("Presente en", nodesWith+" nodo(s)");
  } else if(pick.type==="node"){
    const n=pick.node;
    kindEl.innerHTML=`<span class="dot" style="background:#c2bcae"></span> Nodo`;
    titleEl.textContent=n.name;
    row("Región", n.region);
    row("Pods", n.pods.length);
    const nss=[...new Set(n.pods.map(p=>p.ns))];
    row("Namespaces", nss.length);
    // chips de namespaces
    const chips=document.createElement('div'); chips.className='scroll-chips';
    nss.forEach(ns=>{ const c=document.createElement('span'); c.className='chip'; c.style.borderColor=hexStr(NAMESPACES[ns]??0x888888); c.textContent=ns; chips.appendChild(c); });
    rowsEl.appendChild(chips);
  }
  scrollEl.classList.add('show');
}
function hideScroll(){ scrollEl.classList.remove('show'); }
document.getElementById('scrollClose').onclick=hideScroll;

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

// ---------- orbita ----------
let dragging=false,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;tweening=false;});
addEventListener('pointerup',()=>dragging=false);
addEventListener('pointermove',e=>{ if(!dragging)return; camYaw-=(e.clientX-lastX)*0.006; camPitch-=(e.clientY-lastY)*0.006; camPitch=Math.max(0.15,Math.min(1.45,camPitch)); lastX=e.clientX; lastY=e.clientY; });
renderer.domElement.addEventListener('wheel',e=>{
  e.preventDefault();
  tweening = false;
  const oldDist = camDist;
  const newDist = Math.max(22, Math.min(150, camDist + e.deltaY*0.03));
  if(newDist === oldDist) return;

  // punto del mundo bajo el cursor (interseccion con el plano y=0)
  mouse.x = (e.clientX/innerWidth)*2 - 1;
  mouse.y = -(e.clientY/innerHeight)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
  const focus = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(groundPlane, focus);

  camDist = newDist;
  if(hit){
    // acercar el target hacia el punto bajo el cursor, proporcional a cuanto nos acercamos
    const t = 1 - newDist/oldDist;          // >0 al acercar, <0 al alejar
    camTarget.lerp(focus, t * 0.9);
    // mantener el target a ras de suelo
    camTarget.y = Math.max(0, camTarget.y);
  }
},{passive:false});
let pinch=null;
renderer.domElement.addEventListener('touchmove',e=>{
  if(e.touches.length===2){
    const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    if(pinch){
      const oldDist=camDist;
      const newDist=Math.max(22,Math.min(150,camDist+(pinch-d)*0.05));
      if(newDist!==oldDist){
        const mx=(e.touches[0].clientX+e.touches[1].clientX)/2;
        const my=(e.touches[0].clientY+e.touches[1].clientY)/2;
        mouse.x=(mx/innerWidth)*2-1; mouse.y=-(my/innerHeight)*2+1;
        raycaster.setFromCamera(mouse,camera);
        const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
        const focus=new THREE.Vector3();
        const hit=raycaster.ray.intersectPlane(plane,focus);
        camDist=newDist;
        if(hit){ const t=1-newDist/oldDist; camTarget.lerp(focus,t*0.9); camTarget.y=Math.max(0,camTarget.y); }
      }
    }
    pinch=d;
  }
},{passive:true});
renderer.domElement.addEventListener('touchend',()=>pinch=null);

// ---------- paneo con flechas / WASD (vista de pajaro, con inercia) ----------
const keys = {};
const PAN_KEYS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
addEventListener('keydown', e=>{
  if(PAN_KEYS.includes(e.key)){ keys[e.key.toLowerCase()]=true; tweening=false; e.preventDefault(); }
});
addEventListener('keyup', e=>{ if(PAN_KEYS.includes(e.key)) keys[e.key.toLowerCase()]=false; });

const panVel = new THREE.Vector3();  // velocidad actual (con inercia)
function updatePan(){
  const up = keys['arrowup']||keys['w'];
  const down = keys['arrowdown']||keys['s'];
  const left = keys['arrowleft']||keys['a'];
  const right = keys['arrowright']||keys['d'];

  // direcciones en el plano del suelo segun el yaw
  const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const rightV = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));

  // direccion objetivo segun teclas
  const dir = new THREE.Vector3();
  if(up) dir.add(fwd);
  if(down) dir.sub(fwd);
  if(right) dir.add(rightV);
  if(left) dir.sub(rightV);

  const maxSpeed = camDist * 0.005;          // velocidad tope, escalada al zoom
  const target = dir.lengthSq()>0 ? dir.normalize().multiplyScalar(maxSpeed) : new THREE.Vector3();

  // interpolar la velocidad hacia el objetivo -> aceleracion suave y frenado con inercia
  const ease = dir.lengthSq()>0 ? 0.12 : 0.08;
  panVel.lerp(target, ease);
  if(panVel.lengthSq() > 1e-6) camTarget.add(panVel);
}

// ---------- loop ----------
function animate(){
  requestAnimationFrame(animate);
  updatePan();
  if(tweening){
    camTarget.lerp(tweenTarget, 0.045);
    camDist += (tweenDist - camDist)*0.045;
    if(camTarget.distanceTo(tweenTarget) < 0.08 && Math.abs(camDist-tweenDist) < 0.15){
      camTarget.copy(tweenTarget); camDist = tweenDist; tweening = false;
    }
  }
  camera.position.x=camTarget.x+camDist*Math.sin(camYaw)*Math.cos(camPitch);
  camera.position.z=camTarget.z+camDist*Math.cos(camYaw)*Math.cos(camPitch);
  camera.position.y=camTarget.y+camDist*Math.sin(camPitch);
  camera.lookAt(camTarget);

  // opacidad de las etiquetas de pod
  updatePodLabels();

  renderer.render(scene,camera);
}

const _tmpV = new THREE.Vector3();
function updatePodLabels(){
  nodeGroups.forEach(g=>{
    g.traverse(o=>{
      if(o.userData && o.userData.isPodLabel){
        let target = 0;
        if(nameMode === "all") target = 1;
        else if(nameMode === "off") target = 0;
        else {
          // auto: visible de cerca, se desvanece de lejos
          o.getWorldPosition(_tmpV);
          const dist = camera.position.distanceTo(_tmpV);
          // totalmente visible <22, invisible >42
          target = 1 - (dist - 22) / 20;
          target = Math.max(0, Math.min(1, target));
        }
        // suavizar el cambio
        const m = o.material;
        m.opacity += (target - m.opacity) * 0.15;
        o.visible = m.opacity > 0.02;
      }
    });
  });
}
animate();
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
