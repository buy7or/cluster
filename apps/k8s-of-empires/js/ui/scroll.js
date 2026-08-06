// ---------- click -> pergamino de info ----------
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
