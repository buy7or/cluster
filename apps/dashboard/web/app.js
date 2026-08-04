const services = [
  {
    name: "Pi-hole",
    description:
      "DNS local, bloqueo de publicidad y resolución de dominios internos.",
    url: "http://pihole.home/admin/",
    displayUrl: "pihole.home",
    tag: "DNS",
    icon: "shield-check",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.14)"
  },
  {
    name: "Web Demo",
    description:
      "Primera aplicación desplegada en Kubernetes y gestionada con Kustomize.",
    url: "http://miweb.home",
    displayUrl: "miweb.home",
    tag: "App",
    icon: "globe-2",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.16)"
  },
  {
    name: "Traefik",
    description:
      "Ingress Controller encargado de recibir y enrutar el tráfico HTTP.",
    url: "http://traefik.home",
    displayUrl: "traefik.home",
    tag: "Ingress",
    icon: "route",
    color: "#8b5cf6",
    glow: "rgba(139, 92, 246, 0.16)"
  }
];

const root = document.documentElement;
const grid = document.querySelector("#services-grid");
const count = document.querySelector("#service-count");
const themeButton = document.querySelector("#theme-toggle");
const themeLabel = document.querySelector("#theme-label");
const themeIcon = document.querySelector("#theme-icon");

function renderServices() {
  grid.innerHTML = services
    .map(
      (service, index) => `
        <a
          class="card"
          href="${service.url}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            --card-accent: ${service.color};
            --card-glow: ${service.glow};
            animation-delay: ${index * 0.07}s;
          "
        >
          <div class="card-content">
            <div class="card-header">
              <div class="icon">
                <i data-lucide="${service.icon}"></i>
              </div>

              <span class="arrow">
                <i data-lucide="arrow-up-right"></i>
              </span>
            </div>

            <h3>${service.name}</h3>
            <p>${service.description}</p>
          </div>

          <div class="card-footer">
            <span class="url">${service.displayUrl}</span>
            <span class="tag">${service.tag}</span>
          </div>
        </a>
      `
    )
    .join("");

  count.textContent =
    `${services.length} ${services.length === 1 ? "disponible" : "disponibles"}`;

  lucide.createIcons();
  enableCardGlow();
}

function enableCardGlow() {
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();

      card.style.setProperty(
        "--x",
        `${event.clientX - rect.left}px`
      );

      card.style.setProperty(
        "--y",
        `${event.clientY - rect.top}px`
      );
    });

    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--x", "50%");
      card.style.setProperty("--y", "50%");
    });
  });
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem("homelab-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("homelab-theme", theme);

  const darkModeEnabled = theme === "dark";

  themeIcon.setAttribute(
    "data-lucide",
    darkModeEnabled ? "sun" : "moon"
  );

  themeLabel.textContent =
    darkModeEnabled ? "Modo claro" : "Modo oscuro";

  themeButton.setAttribute(
    "aria-label",
    darkModeEnabled
      ? "Activar modo claro"
      : "Activar modo oscuro"
  );

  lucide.createIcons();
}

themeButton.addEventListener("click", () => {
  const newTheme =
    root.dataset.theme === "dark" ? "light" : "dark";

  applyTheme(newTheme);
});

renderServices();
applyTheme(getInitialTheme());