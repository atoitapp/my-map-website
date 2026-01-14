let groupedCamps = new Map();

// Not secure Password
const AUTH_KEY = "authorized";
let campsData = [];


//Waypoint Colors
const iconBlue = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconGreen = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconRed = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

if (!sessionStorage.getItem(AUTH_KEY)) {
  const password = prompt("Enter the password:");
  if (password !== "lsad123") {
    document.body.innerHTML = "<h1>Access Denied</h1>";
    throw new Error("Wrong password");
  }
  sessionStorage.setItem(AUTH_KEY, "true");
}

// Initialize map
//const map = L.map('map').setView([0, 0], 2); // starting at world view
// Initialize map centered on Montreal
const map = L.map('map').setView([45.5017, -73.5673], 13); // Montreal, zoomed in

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

//Initialize OMS
//const oms = new OverlappingMarkerSpiderfier(map, {
 // keepSpiderfied: true,
//  nearbyDistance: 20
//});

const markers = new Map();

async function fetchWaypoints() {
  try {
    const res = await fetch("https://dataexpert-api.onrender.com/camps");
    campsData = await res.json();

    // Re-render map + table using current search filter
    const search =
      document.getElementById("campSearch")?.value || "";

    renderCamps(search);

  } catch (err) {
    console.error("Failed to fetch camps:", err);
  }
}

async function fetchSummaryData() {
  const res = await fetch("https://dataexpert-api.onrender.com/data");
  const data = await res.json();

  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.date}</td>
      <td>${row.totalmen}</td>
      <td>${row.totalwomen}</td>
      <td>${row.totalsyringe}</td>
      <td>${row.totalpipe}</td>
      <td>${row.totalsandwich}</td>
      <td>${row.totalsoup}</td>
      <td>${row.notes || ""}</td>
    `;

    tbody.appendChild(tr);
  });
}


function renderCamps(filterText = "") {
  const visibleKeys = new Set();
  const tableBody = document.querySelector("#campsTable tbody");
  tableBody.innerHTML = "";
  //const seenIds = new Set();
  const search = filterText.toLowerCase();

  const groups = groupByPosition(campsData);
  groupedCamps = groups;

  // ===== MAP MARKERS (ADD / UPDATE) =====
  groups.forEach((group, key) => {
    const visible = group.filter(loc =>
      loc.name?.toLowerCase().includes(search) ||
      loc.date?.toLowerCase().includes(search) ||
      loc.nowtime?.toLowerCase().includes(search) ||
      loc.type?.toLowerCase().includes(search) ||
      loc.campnotes?.toLowerCase().includes(search)
    );

    if (visible.length === 0) return;
	visibleKeys.add(key);

    const { expertlat, expertlon, type } = visible[0];
    const icon = createNumberedIcon(visible.length, type);

    const popupContent = `
      <strong>${visible.length} logs at this location</strong>
    `;

    if (markers.has(key)) {
      markers.get(key)
        .setIcon(icon)
		.off("click").on("click", () => showCampsInPanel(key));
        //.setPopupContent(popupContent)
        //.addTo(map);
    } else {
      const marker = L.marker([expertlat, expertlon], { icon })
        .addTo(map)
		.on("click", () => showCampsInPanel(key));
        //.bindPopup(popupContent);

      markers.set(key, marker);
    }
  });

  // ===== TABLE (INDIVIDUAL CAMPS) =====
  groups.forEach(group => {
    group.forEach(loc => {
      const matches =
        loc.name?.toLowerCase().includes(search) ||
        loc.date?.toLowerCase().includes(search) ||
        loc.nowtime?.toLowerCase().includes(search) ||
        loc.type?.toLowerCase().includes(search) ||
        loc.campnotes?.toLowerCase().includes(search);

      if (!matches) return;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${loc.name}</td>
        <td>${loc.date}</td>
        <td>${loc.nowtime}</td>
        <td>${loc.men}</td>
        <td>${loc.women}</td>
        <td>${loc.syringe}</td>
        <td>${loc.pipe}</td>
        <td>${loc.sandwich}</td>
        <td>${loc.soup}</td>
        <td>${loc.type}</td>
        <td>${loc.campnotes || ""}</td>
      `;
      tableBody.appendChild(row);
    });
  });

  // ===== CLEANUP (THIS IS IT) =====
  for (const [key, marker] of markers) {
    if (!visibleKeys.has(key)) {
      map.removeLayer(marker);
      markers.delete(key);
    }
  }
}

function showCampsInPanel(key) {
  const panel = document.getElementById("campPanel");
  const content = document.getElementById("campPanelContent");

  const camps = groupedCamps.get(key);
  if (!camps) return;

  panel.style.display = "block";
  content.innerHTML = "";

  camps.forEach(loc => {
    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #ddd";
    div.style.padding = "6px 0";

    div.innerHTML = `
      <strong>${loc.name}</strong><br>
      Date: ${loc.date}<br>
      Time: ${loc.nowtime}<br>
      Men: ${loc.men}, Women: ${loc.women}<br>
      Syringe: ${loc.syringe}, Pipe: ${loc.pipe}<br>
      Sandwich: ${loc.sandwich}, Soup: ${loc.soup}<br>
      Type: ${loc.type}<br>
      Note: <em>${loc.campnotes || ""}</em>
    `;

    content.appendChild(div);
  });
}


function exportToCSV() {
  // Use CURRENTLY FILTERED data (what is visible)
  const search =
    document.getElementById("campSearch")?.value.toLowerCase() || "";

  const rows = [];
  const headers = [
  "Name",
  "Date",
  "Time",
  "Men",
  "Women",
  "Syringe",
  "Pipe",
  "Sandwich",
  "Soup",
  "Type",
  "Notes"
];


  rows.push(headers.join(","));

  campsData.forEach(loc => {
    // Apply same filter as renderCamps
    const matches =
      loc.name?.toLowerCase().includes(search) ||
      loc.date?.toLowerCase().includes(search) ||
      loc.nowtime?.toLowerCase().includes(search) ||
	  loc.type?.toLowerCase().includes(search) ||
      loc.campnotes?.toLowerCase().includes(search);

    if (!matches) return;
    if (loc.expertlat == null || loc.expertlon == null) return;

    const row = [
  loc.name,
  loc.date,
  loc.nowtime,
  loc.men,
  loc.women,
  loc.syringe,
  loc.pipe,
  loc.sandwich,
  loc.soup,
  loc.type,
  `"${(loc.campnotes || "").replace(/"/g, '""')}"`
];

    rows.push(row.join(","));
  });

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "camps.csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportTableToCSV(tableId, filename) {
  const rows = document.querySelectorAll(`#${tableId} tr`);
  let csv = [];

  rows.forEach(row => {
    const cols = row.querySelectorAll("th, td");
    const rowData = [];

    cols.forEach(col => {
      let text = col.innerText.replace(/"/g, '""');
      rowData.push(`"${text}"`);
    });

    csv.push(rowData.join(","));
  });

  const csvBlob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(csvBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


function groupByPosition(data) {
  const groups = new Map();

  data.forEach(loc => {
    if (loc.expertlat == null || loc.expertlon == null) return;

    const key = `${loc.expertlat},${loc.expertlon}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(loc);
  });

  return groups;
}

function createNumberedIcon(count, type) {
  let color;

  if (type === "Walker") color = "#2b6cff";
  else if (type === "Tent") color = "#2ecc71";
  else color = "#e74c3c";

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

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("exportCsv")
    .addEventListener("click", exportToCSV);

  document.getElementById("campSearch")
    .addEventListener("input", e => {
      renderCamps(e.target.value);
    });
	
  document.getElementById("closePanel").addEventListener("click", () => {
     document.getElementById("campPanel").style.display = "none";
   });
   
   document
  .getElementById("exportSummaryCsv")
  .addEventListener("click", () => {
    exportTableToCSV("summaryTable", "summary_data.csv");
  });



  fetchWaypoints();
  fetchSummaryData();
  setInterval(fetchWaypoints, 30000);
});


