// ---------- casas instanciadas (pods) ----------
const HOUSE_WALL_COLORS=[0xe9dcc0,0xf0e2c4,0xdcc9a0,0xe6d2b0];
const houseGableGeo=makeGableRoof(1,1,1).geometry;
houseGableGeo.userData.shared=true;
const houseHipGeo=new THREE.ConeGeometry(1,1,4);
houseHipGeo.userData.shared=true;
const housePoleGeo=new THREE.CylinderGeometry(1,1,1,6);
housePoleGeo.userData.shared=true;

function buildHouseInstances(placements){
  const group=new THREE.Group();
  const parts={ bodies:[], beams:[], gables:[], hips:[], chimneys:[], doors:[], windows:[], poles:[], flags:[] };

  placements.forEach(placement=>{
    const {pod}=placement;
    const rng=makeRng(hashStr(pod.name+":"+pod.port));
    const wallColor=HOUSE_WALL_COLORS[Math.floor(rng()*HOUSE_WALL_COLORS.length)];
    const roofColor=ROOF_PALETTE[Math.floor(rng()*ROOF_PALETTE.length)];
    const w=1.4+rng()*0.8, d=1.4+rng()*0.8;
    const storeys=rng()<0.3?2:1, storeyH=1.1+rng()*0.3, totalH=storeys*storeyH;
    const roofType=rng()<0.5?"gable":"hip";
    const hasChimney=rng()<0.8;
    const roofH=0.7+rng()*0.5;
    const roofApexY=roofType==="gable" ? totalH+roofH : totalH+roofH+0.3;
    const nsColor=NAMESPACES[pod.ns]??0x888888;
    const pick={
      type:"pod",
      pod,
      focus:{x:placement.x,y:placement.y+totalH*0.55,z:placement.z}
    };

    const item=(lx,ly,lz,sx,sy,sz,color,extraRotation=0)=>{
      const cos=Math.cos(placement.rotation), sin=Math.sin(placement.rotation);
      return {
        x:placement.x+lx*cos+lz*sin,
        y:placement.y+ly,
        z:placement.z-lx*sin+lz*cos,
        sx,sy,sz,
        ry:placement.rotation+extraRotation,
        color,
        pick
      };
    };

    parts.bodies.push(item(0,totalH/2,0,w,totalH,d,wallColor));
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      parts.beams.push(item(sx*w/2,totalH/2,sz*d/2,0.12,totalH,0.12));
    });

    if(roofType==="gable"){
      parts.gables.push(item(0,totalH+roofH/2,0,w+0.3,roofH,d+0.3,roofColor));
    } else {
      const radius=Math.max(w,d)*0.72;
      parts.hips.push(item(0,totalH+(roofH+0.3)/2,0,radius,roofH+0.3,radius,roofColor,Math.PI/4));
    }

    if(hasChimney){
      const chimneyX=w*0.25*(rng()<0.5?-1:1);
      parts.chimneys.push(item(chimneyX,totalH+roofH*0.5,d*0.2,0.3,0.8,0.3));
    }

    parts.doors.push(item(0,0.35,d/2+0.01,0.4,0.7,0.06));
    parts.windows.push(item(w*0.28,totalH*0.55,d/2+0.01,0.38,0.38,0.06));
    parts.poles.push(item(0,roofApexY+0.55,0,0.04,1.1,0.04));
    parts.flags.push(item(0.38,roofApexY+0.85,0,0.7,0.42,0.05,nsColor));

    const nameTag=makePodLabel(pod.name,nsColor);
    nameTag.position.set(placement.x,placement.y+roofApexY+1.7,placement.z);
    nameTag.userData.isPodLabel=true;
    group.add(nameTag);
    podLabels.push(nameTag);
  });

  const addBatch=(geometry,material,items,castShadow=false)=>{
    if(!items.length) return;
    const mesh=makeInstances(geometry,material,items);
    mesh.castShadow=castShadow;
    group.add(mesh);
  };

  addBatch(boxGeo,mat(0xffffff),parts.bodies,true);
  addBatch(boxGeo,mat(0x7a5230),parts.beams);
  addBatch(houseGableGeo,mat(0xffffff,{rough:0.8}),parts.gables,true);
  addBatch(houseHipGeo,mat(0xffffff,{rough:0.8}),parts.hips,true);
  addBatch(boxGeo,mat(0x8a5a2a),parts.chimneys);
  addBatch(boxGeo,mat(0x7a5230),parts.doors);
  addBatch(boxGeo,mat(0xfff2b0),parts.windows);
  addBatch(housePoleGeo,mat(0x5c3a21),parts.poles);
  addBatch(boxGeo,mat(0xffffff,{rough:0.6}),parts.flags);

  return group;
}
