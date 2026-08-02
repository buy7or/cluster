# Homelab Kubernetes con k3s

Cluster doméstico formado por tres mini PC Lenovo ThinkCentre.

Se eligió k3s por su menor consumo de recursos y su facilidad de instalación y mantenimiento en entornos domésticos. Además, se prevé incorporar en el futuro una Raspberry Pi con 512 MB de RAM como nodo worker, una configuración compatible con los requisitos mínimos de un agente k3s.

## Arquitectura

| Nodo | IP | Rol |
|---|---|---|
| server1 | 192.168.1.101 | control-plane |
| server2 | 192.168.1.102 | worker |
| server3 | 192.168.1.103 | worker |

## Componentes

- k3s
- Flannel como CNI
- Traefik como Ingress Controller
- MetalLB para servicios LoadBalancer
- Pi-hole como DNS local

## Direcciones usadas

| Servicio | IP |
|---|---|
| Pi-hole | 192.168.1.99 |
| Traefik | 192.168.1.100 |

