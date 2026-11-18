
let groupedCamps = new Map();
let campsData = [];
const markers = new Map();

// Not secure: this password is visible in the JavaScript source.
const AUTH_KEY = "authorized";

// =====================
// AUTHENTIFICATION
// =====================
if (!sessionStorage.getItem(AUTH_KEY)) {
  const password = prompt("Entrez le mot de passe:");

  if (password !== "lsad123") {
    document.body.innerHTML = "<h1>Accès refusé</h1>";
    throw new Error("Mot de passe incorrect");
  }

  sessionStorage.setItem(AUTH_KEY, "true");
}

// =====================
// INITIALIZE MAP
// =====================
const map = L.map("map").setView([45.5017, -73.5673], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// =====================
// MAP LEGEND
// =====================
const legend = L.control({ position: "topright" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "map-legend");

  div.innerHTML = `
    <strong>Légende</strong>
    <div class="map-legend-item">
      <div class="legend-color" style="background:#2b6cff;"></div>
      <span>Passant</span>
    </div>
    <div class="map-legend-item">
      <div class="legend-color" style="background:#2ecc71;"></div>
      <span>Tente</span>
    </div>
    <div class="map-legend-item">
      <div class="legend-color" style="background:#e74c3c;"></div>
      <span>Seringue / Pipe</span>
    </div>
  `;

  return div;
};

legend.addTo(map);

// =====================
// FETCH CAMPS
// =====================
async function fetchWaypoints() {
  try {
    const res = await fetch("https://dataexpert-api.onrender.com/camps");

    if (!res.ok) {
      throw new Error(`Erreur API: ${res.status}`);
    }

    campsData = await res.json();

    const search =
      document.getElementById("campSearch")?.value || "";

    renderCamps(search);

  } catch (err) {
    console.error("Échec du chargement des données :", err);
  }
}

// =====================
// FETCH SUMMARY DATA
// =====================
async function fetchSummaryData() {
  try {
    const res = await fetch("https://dataexpert-api.onrender.com/data");

    if (!res.ok) {
      throw new Error(`Erreur API: ${res.status}`);
    }

    const data = await res.json();

    const tbody = document.querySelector("#summaryTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    data.forEach(row => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${row.name ?? ""}</td>
        <td>${row.date ?? ""}</td>
        <td>${row.totalcamp ?? ""}</td>
        <td>${row.totalmen ?? ""}</td>
        <td>${row.totalwomen ?? ""}</td>
        <td>${row.notes ?? ""}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Échec du chargement du résumé :", err);
  }
}

// =====================
// RENDER CAMPS
// =====================
function renderCamps(filterText = "") {
  const visibleKeys = new Set();

  const tableBody = document.querySelector("#campsTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  const search = filterText.toLowerCase();

  // Group camps for map markers
  const groups = groupByPosition(campsData);
  groupedCamps = groups;

  // =====================
  // MAP MARKERS
  // =====================
  groups.forEach((group, key) => {
    const visible = group.filter(loc =>
      loc.name?.toLowerCase().includes(search) ||
      loc.date?.toLowerCase().includes(search) ||
      loc.nowtime?.toLowerCase().includes(search) ||
      loc.campnotes?.toLowerCase().includes(search)
    );

    if (visible.length === 0) return;

    visibleKeys.add(key);

    const { camplat, camplon, type } = visible[0];

    const icon = createNumberedIcon(visible.length, type);

    if (markers.has(key)) {
      markers.get(key)
        .setLatLng([Number(camplat), Number(camplon)])
        .setIcon(icon)
        .off("click")
        .on("click", () => showCampsInPanel(key));

    } else {
      const marker = L.marker(
        [Number(camplat), Number(camplon)],
        { icon }
      )
        .addTo(map)
        .on("click", () => showCampsInPanel(key));

      markers.set(key, marker);
    }
  });

  // =====================
  // TABLE - INDIVIDUAL CAMPS
  // =====================
  // Important: use campsData directly.
  // This allows records without coordinates to appear in the table.

  campsData.forEach(loc => {
    const matches =
      loc.name?.toLowerCase().includes(search) ||
      loc.date?.toLowerCase().includes(search) ||
      loc.nowtime?.toLowerCase().includes(search) ||
      loc.campnotes?.toLowerCase().includes(search);

    if (!matches) return;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${loc.name ?? ""}</td>
      <td>${loc.date ?? ""}</td>
      <td>${loc.nowtime ?? ""}</td>
      <td>${loc.men ?? ""}</td>
      <td>${loc.women ?? ""}</td>
      <td>${loc.statut ?? ""}</td>
      <td>${loc.condition ?? ""}</td>
      <td>${loc.camplat ?? ""} ${loc.camplon ?? ""}</td>
      <td>${loc.campnotes ?? ""}</td>
    `;

    tableBody.appendChild(row);
  });

  // =====================
  // REMOVE INVISIBLE MARKERS
  // =====================
  for (const [key, marker] of markers) {
    if (!visibleKeys.has(key)) {
      map.removeLayer(marker);
      markers.delete(key);
    }
  }
}

// =====================
// SHOW CAMPS IN PANEL
// =====================
function showCampsInPanel(key) {
  const panel = document.getElementById("campPanel");
  const content = document.getElementById("campPanelContent");

  const camps = groupedCamps.get(key);
  if (!camps || !panel || !content) return;

  panel.style.display = "block";
  content.innerHTML = "";

  camps.forEach(loc => {
    const div = document.createElement("div");
    div.className = "camp-item";

    div.innerHTML = `
      <div class="camp-title">${loc.name ?? ""}</div>

      <div class="camp-grid">
        <div class="label">Date</div>
        <div class="value">${loc.date ?? ""}</div>

        <div class="label">Heure</div>
        <div class="value">${loc.nowtime ?? ""}</div>

        <div class="label">Homme / Femme</div>
        <div class="value">${loc.men ?? ""} / ${loc.women ?? ""}</div>

        <div class="label">Statut / Condition</div>
        <div class="value">${loc.statut ?? ""} / ${loc.condition ?? ""}</div>

        <div class="label">Note</div>
        <div class="value note">${loc.campnotes || "—"}</div>
      </div>
    `;

    content.appendChild(div);
  });
}

// =====================
// CSV HELPER
// =====================
function csvValue(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// =====================
// EXPORT CAMPS TO CSV
// =====================
function exportToCSV() {
  const search =
    document.getElementById("campSearch")?.value.toLowerCase() || "";

  const headers = [
    "Nom",
    "Date",
    "Heure",
    "Homme",
    "Femme",
    "Statut",
    "Condition",
    "Position",
    "Note"
  ];

  const rows = [headers.map(csvValue).join(";")];

  campsData.forEach(loc => {
    const matches =
      loc.name?.toLowerCase().includes(search) ||
      loc.date?.toLowerCase().includes(search) ||
      loc.nowtime?.toLowerCase().includes(search) ||
      loc.campnotes?.toLowerCase().includes(search);

    if (!matches) return;

    const position =
      `${loc.camplat ?? ""} ${loc.camplon ?? ""}`.trim();

    const row = [
      loc.name,
      loc.date,
      loc.nowtime,
      loc.men,
      loc.women,
      loc.statut,
      loc.condition,
      position,
      loc.campnotes
    ];

    rows.push(row.map(csvValue).join(";"));
  });

  const csvContent = "\uFEFF" + rows.join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(":", "-");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `Données_d’expert_${date}_${time}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// =====================
// EXPORT SUMMARY TABLE TO CSV
// =====================
function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll("tr");
  const csv = [];

  rows.forEach(row => {
    const cols = row.querySelectorAll("th, td");
    const rowData = [];

    cols.forEach(col => {
      rowData.push(csvValue(col.innerText));
    });

    csv.push(rowData.join(","));
  });

  const csvBlob = new Blob(["\uFEFF" + csv.join("\n")], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(csvBlob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

// =====================
// GROUP CAMPS BY POSITION
// =====================
const GROUP_RADIUS_METERS = 5;

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function groupByPosition(data) {
  const groups = new Map();
  let groupId = 0;

  data.forEach(loc => {
    if (loc.camplat == null || loc.camplon == null) return;

    let foundGroupKey = null;

    for (const [key, group] of groups) {
      const ref = group[0];

      const dist = distanceMeters(
        Number(ref.camplat),
        Number(ref.camplon),
        Number(loc.camplat),
        Number(loc.camplon)
      );

      if (dist <= GROUP_RADIUS_METERS) {
        foundGroupKey = key;
        break;
      }
    }

    if (foundGroupKey !== null) {
      groups.get(foundGroupKey).push(loc);
    } else {
      const key = `group-${groupId++}`;
      groups.set(key, [loc]);
    }
  });

  return groups;
}

// =====================
// ALTERNATIVE EXACT POSITION GROUPING
// =====================
function groupByPosition0(data) {
  const groups = new Map();

  data.forEach(loc => {
    if (loc.camplat == null || loc.camplon == null) return;

    const key = `${loc.camplat},${loc.camplon}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(loc);
  });

  return groups;
}

// =====================
// NUMBERED MAP ICON
// =====================
function createNumberedIcon(count, type) {
  let color;

  const normalizedType = (type || "").toLowerCase();

  if (normalizedType === "walker") {
    color = "#2b6cff";
  } else if (normalizedType === "tent") {
    color = "#2ecc71";
  } else {
    color = "#e74c3c";
  }

  return L.divIcon({
    className: "camp-marker",
    html: `
      <div style="
        background:${color};
        color:white;
        border-radius:50%;
        width:32px;
        height:32px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:bold;
        border:2px solid white;
        box-shadow:0 0 4px rgba(0,0,0,0.5);
      ">
        ${count}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// =====================
// PAGE EVENTS
// =====================
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("exportCsv")
    ?.addEventListener("click", exportToCSV);

  document.getElementById("campSearch")
    ?.addEventListener("input", e => {
      renderCamps(e.target.value);
    });

  document.getElementById("closePanel")
    ?.addEventListener("click", () => {
      document.getElementById("campPanel").style.display = "none";
    });

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(":", "-");

  document.getElementById("exportSummaryCsv")
    ?.addEventListener("click", () => {
      exportTableToCSV(
        "summaryTable",
        `Données_total_${date}_${time}.csv`
      );
    });

  fetchWaypoints();
  fetchSummaryData();

  setInterval(fetchWaypoints, 30000);
});
