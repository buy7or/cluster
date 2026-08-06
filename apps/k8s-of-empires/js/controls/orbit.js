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
