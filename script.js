// Not very secure Password
const password = prompt("Enter the password:");

if (password !== "lsad123") {
  document.body.innerHTML = "<h1>Access Denied</h1>";
  throw new Error("Wrong password");
}
// Initialize map
//const map = L.map('map').setView([0, 0], 2); // starting at world view
// Initialize map centered on Montreal
const map = L.map('map').setView([45.5017, -73.5673], 13); // Montreal, zoomed in

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

let markers = []; // store markers to remove later

const markersMap = new Map(); // key: loc.name (or ID), value: marker

async function fetchWaypoints() {
  try {
    const res = await fetch('https://dataexpert-api.onrender.com/camps');
    const data = await res.json();

    const newKeys = new Set();

    data.forEach(loc => {
      const key = loc.name; // unique identifier
      newKeys.add(key);

      const popupContent = `
        <strong>${loc.name}</strong><br>
        Date: ${loc.date}<br>
        Time: ${loc.nowtime}<br>
        Notes: ${loc.campnotes}
      `;

      if (markersMap.has(key)) {
        // Update existing marker
        const marker = markersMap.get(key);
        marker.setLatLng([loc.expertlat, loc.expertlon]);
        marker.setPopupContent(popupContent);
      } else {
        // Add new marker
        const marker = L.marker([loc.expertlat, loc.expertlon])
          .addTo(map)
          .bindPopup(popupContent, { autoClose: false, closeOnClick: false });
        markersMap.set(key, marker);
      }
    });

    // Remove markers that no longer exist
    for (const [key, marker] of markersMap.entries()) {
      if (!newKeys.has(key)) {
        map.removeLayer(marker);
        markersMap.delete(key);
      }
    }

  } catch (err) {
    console.error('Failed to fetch waypoints:', err);
  }
}


// Initial load
fetchWaypoints();

// Refresh every 5 seconds
setInterval(fetchWaypoints, 5000);

