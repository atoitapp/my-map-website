// ❌ Not secure – for internal use only
const password = prompt("Enter the password:");

if (password !== "lsad123") {
  document.body.innerHTML = "<h1>Access Denied</h1>";
  throw new Error("Wrong password");
}

/* ---------------- MAP INIT ---------------- */
const map = L.map('map').setView([45.5017, -73.5673], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

let markers = [];
let cachedData = [];

/* ---------------- DOM ELEMENTS ---------------- */
const filterInput = document.getElementById('filterInput');
const exportBtn = document.getElementById('exportBtn');
const tableBody = document.querySelector('#campTable tbody');

/* ---------------- FETCH & RENDER ---------------- */
async function fetchWaypoints() {
  try {
    const res = await fetch('https://dataexpert-api.onrender.com/camps');
    const data = await res.json();
    cachedData = data;

    // Clear markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Clear table
    tableBody.innerHTML = '';

    data.forEach(loc => {
      // Marker
      const popupContent = `
        <strong>${loc.name}</strong><br>
        Date: ${loc.date}<br>
        Time: ${loc.nowtime}<br>
        Notes: ${loc.campnotes}
      `;

      const marker = L.marker([loc.expertlat, loc.expertlon])
        .addTo(map)
        .bindPopup(popupContent, { autoClose: false, closeOnClick: false });

      markers.push(marker);

      // Table row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${loc.name}</td>
        <td>${loc.date}</td>
        <td>${loc.nowtime}</td>
        <td>${loc.campnotes}</td>
        <td>${loc.expertlat}</td>
        <td>${loc.expertlon}</td>
      `;

      row.addEventListener('click', () => {
        map.setView([loc.expertlat, loc.expertlon], 15);
        marker.openPopup();
      });

      tableBody.appendChild(row);
    });

    filterTable(); // reapply filter after refresh

  } catch (err) {
    console.error('Failed to fetch waypoints:', err);
  }
}

/* ---------------- FILTER ---------------- */
function filterTable() {
  const filter = filterInput.value.toLowerCase();
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

/* ---------------- EXPORT CSV ---------------- */
function exportTableToCSV() {
  const rows = document.querySelectorAll('#campTable tr');
  let csv = [];

  rows.forEach(row => {
    if (row.style.display === 'none') return;

    const cols = row.querySelectorAll('th, td');
    const rowData = [];

    cols.forEach(col => {
      rowData.push(`"${col.innerText.replace(/"/g, '""')}"`);
    });

    csv.push(rowData.join(','));
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'camps.csv';
  a.click();

  URL.revokeObjectURL(url);
}

/* ---------------- EVENTS ---------------- */
filterInput.addEventListener('keyup', filterTable);
exportBtn.addEventListener('click', exportTableToCSV);

/* ---------------- AUTO REFRESH ---------------- */
fetchWaypoints();
setInterval(fetchWaypoints, 5000);
