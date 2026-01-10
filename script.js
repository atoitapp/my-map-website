// Not secure Password
const AUTH_KEY = "authorized";

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
    const res = await fetch('https://dataexpert-api.onrender.com/camps');
    const data = await res.json();

    const tableBody = document.querySelector("#campsTable tbody");
    tableBody.innerHTML = ""; // clear table

    const seenIds = new Set();

    data.forEach(loc => {
      // Skip invalid coordinates
      if (loc.expertlat == null || loc.expertlon == null) return;

      seenIds.add(loc.id);

      const popupContent = `
        <strong>${loc.name}</strong><br>
        Date: ${loc.date}<br>
        Time: ${loc.nowtime}<br>
        Notes: ${loc.campnotes}
      `;

      // --- MAP MARKERS ---
      if (markers.has(loc.id)) {
        markers.get(loc.id).setPopupContent(popupContent);
      } else {
        const marker = L.marker([loc.expertlat, loc.expertlon])
          .addTo(map)
          .bindPopup(popupContent, { autoClose: false, closeOnClick: false });

        markers.set(loc.id, marker);
      }

      // --- TABLE ROW ---
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

    // Remove deleted markers
    for (const [id, marker] of markers) {
      if (!seenIds.has(id)) {
        map.removeLayer(marker);
        markers.delete(id);
      }
    }

  } catch (err) {
    console.error("Failed to fetch camps:", err);
  }
}

// Initial load
fetchWaypoints();

// Refresh every 5 seconds
setInterval(fetchWaypoints, 30000);
