// Not secure Password
const AUTH_KEY = "authorized";
let campsData = [];

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


function renderCamps(filterText = "") {
  const tableBody = document.querySelector("#campsTable tbody");
  tableBody.innerHTML = "";

  const seenIds = new Set();
  const search = filterText.toLowerCase();

  campsData.forEach(loc => {
    // Filter text
    const matches =
      loc.name?.toLowerCase().includes(search) ||
      loc.date?.toLowerCase().includes(search) ||
      loc.nowtime?.toLowerCase().includes(search) ||
      loc.campnotes?.toLowerCase().includes(search);

    if (!matches) return;

    // Skip invalid coordinates
    if (loc.expertlat == null || loc.expertlon == null) return;

    seenIds.add(loc.id);

    const popupContent = `
      <strong>${loc.name}</strong><br>
      Date: ${loc.date}<br>
      Time: ${loc.nowtime}<br>
      Notes: ${loc.campnotes}
    `;

    // Map markers
    if (markers.has(loc.id)) {
      markers.get(loc.id).setPopupContent(popupContent).addTo(map);
    } else {
      const marker = L.marker([loc.expertlat, loc.expertlon])
        .addTo(map)
        .bindPopup(popupContent, { autoClose: false, closeOnClick: false });

      markers.set(loc.id, marker);
    }

    // Table row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${loc.name}</td>
      <td>${loc.date}</td>
      <td>${loc.nowtime}</td>
      <td>${loc.expertlat}</td>
      <td>${loc.expertlon}</td>
      <td>${loc.campnotes || ""}</td>
    `;
    tableBody.appendChild(row);
  });

  // Remove hidden markers
  for (const [id, marker] of markers) {
    if (!seenIds.has(id)) {
      map.removeLayer(marker);
    }
  }
}

// SEARCH INPUT
document.getElementById("campSearch").addEventListener("input", e => {
  renderCamps(e.target.value);
});

// START APP
fetchWaypoints();
setInterval(fetchWaypoints, 30000);
