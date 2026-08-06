// ---------- loop ----------
let lastFrameTime = performance.now();
function animate(now=performance.now()){
  requestAnimationFrame(animate);
  const dt = Math.min((now-lastFrameTime)/1000, 0.05);
  lastFrameTime = now;
  updatePan(dt);
  if(tweening){
    const tweenAlpha = 1-Math.exp(-9*dt);
    camTarget.lerp(tweenTarget, tweenAlpha);
    camDist += (tweenDist - camDist)*tweenAlpha;
    if(camTarget.distanceTo(tweenTarget) < 0.08 && Math.abs(camDist-tweenDist) < 0.15){
      camTarget.copy(tweenTarget); camDist = tweenDist; tweening = false;
    }
  }
  camera.position.x=camTarget.x+camDist*Math.sin(camYaw)*Math.cos(camPitch);
  camera.position.z=camTarget.z+camDist*Math.cos(camYaw)*Math.cos(camPitch);
  camera.position.y=camTarget.y+camDist*Math.sin(camPitch);
  camera.lookAt(camTarget);

  // opacidad de las etiquetas de pod
  updatePodLabels(dt);

  renderer.render(scene,camera);
}

const _tmpV = new THREE.Vector3();
function updatePodLabels(dt){
  const fadeAlpha = 1-Math.exp(-10*dt);
  podLabels.forEach(o=>{
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
    m.opacity += (target - m.opacity) * fadeAlpha;
    o.visible = m.opacity > 0.02;
  });
}
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
