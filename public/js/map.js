/**
 * Mapa de apoio — Leaflet + OpenStreetMap.
 */
window.FH = window.FH || {};

const DEFAULT_POIS = [
  { name: "DEAM Centro", category: "DEAM", lat: -23.5505, lng: -46.6333, address: "Rua Exemplo, 100", phone: "190" },
  { name: "Hospital das Mulheres", category: "Hospital", lat: -23.5489, lng: -46.6388, address: "Av. Saúde, 500", phone: "(11) 3000-0000" },
  { name: "ONG Mulheres em Rede", category: "ONG", lat: -23.552, lng: -46.63, address: "Rua Apoio, 45", phone: "(11) 4000-0000" },
  { name: "Delegacia da Mulher", category: "Delegacia", lat: -23.547, lng: -46.641, address: "Av. Segurança, 200", phone: "197" },
  { name: "Centro de Acolhimento", category: "ONG", lat: -23.555, lng: -46.628, address: "Rua Acolhimento, 12", phone: "(11) 5000-0000" },
];

window.FH.initMapPage = async function () {
  const mapEl = document.getElementById("map");
  const listEl = document.getElementById("poi-list");
  const filterContainer = document.getElementById("map-filters");
  if (!mapEl) return;

  let pois = DEFAULT_POIS;
  try {
    const data = await window.FH.loadContent();
    if (data.pois?.length) pois = data.pois;
  } catch {
    /* usa POIs padrão */
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  let userLat = -23.5505;
  let userLng = -46.6333;
  let activeFilter = "all";

  try {
    const loc = await window.FH.getCurrentLocation();
    userLat = loc.latitude;
    userLng = loc.longitude;
  } catch {
    /* centro padrão SP */
  }

  const map = L.map(mapEl).setView([userLat, userLng], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  const markers = [];

  function distanceKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function renderMarkers() {
    markers.forEach((m) => map.removeLayer(m));
    markers.length = 0;

    const filtered =
      activeFilter === "all" ? pois : pois.filter((p) => p.category === activeFilter);

    const withDist = filtered.map((p) => ({
      ...p,
      distance: distanceKm({ lat: userLat, lng: userLng }, p),
    }));
    withDist.sort((a, b) => a.distance - b.distance);

    withDist.forEach((p) => {
      const marker = L.marker([p.lat, p.lng])
        .addTo(map)
        .bindPopup(`<strong>${p.name}</strong><br>${p.category}<br>${p.address}<br>${p.phone}`);
      markers.push(marker);
    });

    if (listEl) {
      listEl.innerHTML = withDist
        .map(
          (p) => `
        <div class="card">
          <h3 class="card__title">${p.name}</h3>
          <p class="card__text">${p.category} · ${p.distance.toFixed(1)} km<br>${p.address}<br>${p.phone}</p>
        </div>`
        )
        .join("");
    }
  }

  if (filterContainer) {
    const cats = ["all", ...new Set(pois.map((p) => p.category))];
    filterContainer.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="tag${c === "all" ? " tag--active" : ""}" data-cat="${c}">${
            c === "all" ? "Todos" : c
          }</button>`
      )
      .join("");

    filterContainer.querySelectorAll(".tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        filterContainer.querySelectorAll(".tag").forEach((t) => t.classList.remove("tag--active"));
        btn.classList.add("tag--active");
        activeFilter = btn.dataset.cat;
        renderMarkers();
      });
    });
  }

  renderMarkers();
};

document.addEventListener("femhelp:ready", () => {
  if (document.body.dataset.page === "map") {
    window.FH.initMapPage();
  }
});
