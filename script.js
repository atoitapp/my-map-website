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

async function fetchWaypoints() {
  try {
    const res = await fetch('https://dataexpert-api.onrender.com/camps');
    const data = await res.json();

    // Remove old markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Add new markers
    data.forEach(loc => {
      const popupContent = `
        <strong>${loc.name}</strong><br>
        Date: ${loc.date}<br>
        Time: ${loc.nowtime}<br>
        Notes: ${loc.campnotes}
      `;

      const marker = L.marker([loc.expertlat, loc.expertlon])
        .addTo(map)
        .bindPopup(popupContent); // bind all info in a single popup

      markers.push(marker);
    });
  } catch (err) {
    console.error('Failed to fetch waypoints:', err);
  }
}

// Initial load
fetchWaypoints();

// Refresh every 5 seconds
setInterval(fetchWaypoints, 5000);

