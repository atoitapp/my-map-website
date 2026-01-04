// Initialize map
const map = L.map('map').setView([0, 0], 2); // starting at world view

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

let markers = []; // store markers to remove later
