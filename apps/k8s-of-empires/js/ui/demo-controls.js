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
