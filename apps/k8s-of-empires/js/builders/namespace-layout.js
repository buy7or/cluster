// ---------- namespace: agrupar pods ----------
function groupByNamespace(pods=[]){
  const map = new Map();
  pods.forEach(p=>{ if(!map.has(p.ns)) map.set(p.ns, []); map.get(p.ns).push(p); });
  return [...map.entries()]; // [ [ns, pods[]], ... ]
}

// tamaño (lado) que ocupa un grupo de namespace segun nº de pods
const CELL = 3.6;
function nsBlockSize(count){
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  return { cols, side: cols*CELL };
}
