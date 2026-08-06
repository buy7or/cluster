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
