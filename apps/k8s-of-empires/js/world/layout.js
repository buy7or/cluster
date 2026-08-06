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
