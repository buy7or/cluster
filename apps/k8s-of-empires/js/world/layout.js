// ---------- layout global ----------
function layoutNodes(){
  const gaps=10;
  const totalW = nodeGroups.reduce((a,g)=>a+g.userData.plot,0) + gaps*(nodeGroups.length-1);
  let x=-totalW/2;
  nodeGroups.forEach(g=>{
    const w=g.userData.plot; g.position.x=x+w/2; x+=w+gaps;
  });
  updateGround();
  nodeGroups.forEach(freezeStaticObject);
  freezeStaticObject(islandDeco);
}

function freezeStaticObject(root){
  root.traverse(o=>{
    o.updateMatrix();
    o.matrixAutoUpdate=false;
  });
  root.updateMatrixWorld(true);
}

function rebuildWorld(){
  nodeGroups.forEach(g=>{
    scene.remove(g);
    disposeObject(g);
  });
  scene.children.filter(c=>c.isSprite).forEach(s=>scene.remove(s));
  nodeGroups.length=0;
  podLabels.length=0;
  nodeData.forEach(node=>{
    const g=buildNode(node); scene.add(g); nodeGroups.push(g);
  });
  layoutNodes();
  refreshPickables();
  renderer.shadowMap.needsUpdate=true;
  renderLegend();
  const sc=document.getElementById('scroll'); if(sc) sc.classList.remove('show');
}

function refreshPickables(){
  pickableObjects = [];
  nodeGroups.forEach(g=>{
    g.traverse(o=>{
      if(o.userData && (o.userData.pick || o.userData.instancePicks)) pickableObjects.push(o);
    });
  });
}

function disposeObject(root){
  root.traverse(o=>{
    if(o.geometry && !(o.geometry.userData && o.geometry.userData.shared)){
      o.geometry.dispose();
    }
    const materials = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    materials.forEach(material=>{
      if(material.userData && material.userData.shared) return;
      Object.keys(material).forEach(k=>{
        const v = material[k];
        if(v && v.isTexture && !(v.userData && v.userData.shared)) v.dispose();
      });
      material.dispose();
    });
  });
}
