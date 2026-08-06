function makeGableRoof(w,d,h){
  const geo=new THREE.BufferGeometry(); const hw=w/2,hd=d/2,hh=h/2;
  const v=[-hw,-hh,hd, hw,-hh,hd, 0,hh,hd, -hw,-hh,-hd, hw,-hh,-hd, 0,hh,-hd];
  const idx=[0,1,2, 3,5,4, 0,2,5,0,5,3, 1,4,5,1,5,2, 0,3,4,0,4,1];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v,3)); geo.setIndex(idx); geo.computeVertexNormals();
  return new THREE.Mesh(geo);
}
