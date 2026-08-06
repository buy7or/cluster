// ---------- helpers ----------
const boxGeo = new THREE.BoxGeometry(1,1,1);
boxGeo.userData.shared = true;
const instanceTransform = new THREE.Object3D();

function makeBoxInstances(material, items){
  const mesh = new THREE.InstancedMesh(boxGeo, material, items.length);
  items.forEach((item, index)=>{
    instanceTransform.position.set(item.x, item.y, item.z);
    instanceTransform.scale.set(item.sx, item.sy, item.sz);
    instanceTransform.rotation.set(0, 0, 0);
    instanceTransform.updateMatrix();
    mesh.setMatrixAt(index, instanceTransform.matrix);
  });
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  return mesh;
}

const materialCache = new Map();
function mat(color, opts={}){
  const {rough,...rest}=opts;
  const key = JSON.stringify({ color, roughness: rough??0.9, metalness:0, ...rest });
  if(!materialCache.has(key)){
    const material = new THREE.MeshStandardMaterial({ color, roughness: rough??0.9, metalness:0, ...rest });
    material.userData.shared = true;
    materialCache.set(key, material);
  }
  return materialCache.get(key);
}
const ROOF_PALETTE = [0xc1503a, 0xb0553c, 0xa0522d, 0x8b6f47, 0x6d7a8c, 0x9c4a5a];

const woodFloorMaterialCache = new Map();
function makeWoodFloorMaterial(plotSize){
  const repeat = Math.max(2, Math.round(plotSize/5));
  if(woodFloorMaterialCache.has(repeat)) return woodFloorMaterialCache.get(repeat);

  const c=document.createElement('canvas'); c.width=c.height=256;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#5f3b1f'; ctx.fillRect(0,0,256,256);

  const plankH = 32;
  for(let y=0; y<256; y+=plankH){
    ctx.fillStyle = (y/plankH)%2 ? '#6b4423' : '#56361d';
    ctx.fillRect(0,y,256,plankH);
    ctx.strokeStyle='rgba(32,18,9,0.45)';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(256,y+0.5); ctx.stroke();

    for(let x=0; x<256; x+=64){
      const off = ((y/plankH)%2)*32;
      ctx.strokeStyle='rgba(38,21,10,0.38)';
      ctx.beginPath(); ctx.moveTo(x+off,y+2); ctx.lineTo(x+off,y+plankH-2); ctx.stroke();
    }
  }

  const rng=makeRng(9042);
  for(let i=0;i<180;i++){
    const y=Math.floor(rng()*256);
    const x=rng()*256;
    const len=18+rng()*58;
    ctx.strokeStyle = rng()<0.5 ? 'rgba(95,61,32,0.35)' : 'rgba(35,19,9,0.25)';
    ctx.lineWidth = 1+rng()*1.2;
    ctx.beginPath(); ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+len*0.3,y-4+rng()*8,x+len*0.7,y-4+rng()*8,x+len,y);
    ctx.stroke();
  }

  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.userData = tex.userData || {};
  tex.userData.shared = true;

  const material = new THREE.MeshStandardMaterial({ color:0x6b4423, map:tex, roughness:0.92, metalness:0 });
  material.userData.shared = true;
  woodFloorMaterialCache.set(repeat, material);
  return material;
}
