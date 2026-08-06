// ---------- namespaces ----------
const NAMESPACES = {
  "production": 0x4f86c6,   // azul
  "staging":    0xe0a03a,   // ambar
  "kube-system":0x9c6ade,   // morado
  "monitoring": 0x3fae8f    // verde azulado
};
const NS_LIST = Object.keys(NAMESPACES);

// ---------- datos del cluster (mutable) ----------
let podCounter = 0;
const IMAGE_POOL = [
  "nginx:1.27", "redis:7.2", "postgres:16", "node:20-alpine", "python:3.12-slim",
  "grafana/grafana:11.1", "prom/prometheus:v2.53", "traefik:v3.1", "busybox:1.36",
  "registry.k8s.io/coredns:1.11", "ghcr.io/app/api:2.4.1", "mongo:7.0"
];
function mkPod(name, ns){
  return {
    name: name || ("pod-"+(++podCounter)),
    port: 8000+Math.floor(Math.random()*2000),
    ns: ns || "production",
    image: IMAGE_POOL[Math.floor(Math.random()*IMAGE_POOL.length)]
  };
}
const nodeData = [
  { name:"srv-node-01", region:"eu-west-1a", pods:[
    mkPod("api-gw","production"), mkPod("auth","production"), mkPod("cache","staging")
  ]},
  { name:"srv-node-02", region:"eu-west-1b", pods:[
    mkPod("postgres","production"), mkPod("coredns","kube-system"), mkPod("prometheus","monitoring")
  ]},
  { name:"srv-node-03", region:"eu-west-1c", pods:[
    mkPod("frontend","production"), mkPod("cdn","staging"), mkPod("kubelet","kube-system"), mkPod("grafana","monitoring")
  ]}
];

// ---------- rng ----------
function makeRng(seed){ let a=seed>>>0; return function(){ a|=0;a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
