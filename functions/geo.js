// =========================
// 1) PUNE PIN → AREA MAP (Exact match when PIN is reliable)
// =========================

const areaMap = {
  "411014": "Kharadi",
  "411015": "Viman Nagar",
  "411028": "Hadapsar",
  "411036": "Mundhwa / Keshav Nagar",
  "411006": "Yerwada",
  "411047": "Lohegaon",
  "412207": "Wagholi",
  "412307": "Manjari",
  "412308": "Phursungi",
  "411001": "Camp / MG Road",
  "411004": "Koregaon Park",
  "411005": "Bund Garden Road",
  "411030": "Sadashiv Peth",
  "411038": "Kothrud Depot",
  "411029": "Kothrud",
  "411058": "Warje",
  "411052": "Karve Nagar",
  "411007": "Aundh",
  "411045": "Baner",
  "411021": "Pashan / Bavdhan",
  "411057": "Wakad",
  "411033": "Hinjewadi",
  "411017": "Pimpri",
  "411019": "Chinchwad",
  "411035": "Bhosari",
  "411044": "Nigdi",
  "411039": "Akurdi",
  "412101": "Ravet",
  "411037": "Bibwewadi",
  "411046": "Katraj",
  "411043": "Dhankawadi",
  "411060": "Undri / Pisoli"
};


// =========================
// 2) FULL PUNE GEO-GRID (Bounding Box Matcher)
// =========================

const GEO_GRID = {
  // EAST PUNE
  "Kharadi": { minLat: 18.545, maxLat: 18.575, minLon: 73.940, maxLon: 73.982 },
  "Viman Nagar": { minLat: 18.560, maxLat: 18.585, minLon: 73.890, maxLon: 73.920 },
  "Wadgaon Sheri": { minLat: 18.545, maxLat: 18.573, minLon: 73.918, maxLon: 73.940 },
  "Yerwada": { minLat: 18.555, maxLat: 18.590, minLon: 73.865, maxLon: 73.900 },
  "Koregaon Park": { minLat: 18.530, maxLat: 18.565, minLon: 73.880, maxLon: 73.915 },
  "Ghorpadi": { minLat: 18.515, maxLat: 18.540, minLon: 73.900, maxLon: 73.930 },
  "Mundhwa": { minLat: 18.521, maxLat: 18.548, minLon: 73.935, maxLon: 73.970 },
  "Keshav Nagar": { minLat: 18.530, maxLat: 18.560, minLon: 73.960, maxLon: 73.990 },
  "Hadapsar": { minLat: 18.490, maxLat: 18.530, minLon: 73.910, maxLon: 73.960 },
  "Magarpatta": { minLat: 18.505, maxLat: 18.525, minLon: 73.925, maxLon: 73.948 },
  "Amanora": { minLat: 18.508, maxLat: 18.530, minLon: 73.950, maxLon: 73.975 },
  "Manjari": { minLat: 18.470, maxLat: 18.500, minLon: 73.970, maxLon: 74.010 },
  "Phursungi": { minLat: 18.460, maxLat: 18.492, minLon: 73.940, maxLon: 73.980 },
  "Wagholi": { minLat: 18.575, maxLat: 18.620, minLon: 73.980, maxLon: 74.050 },
  "Lohegaon": { minLat: 18.580, maxLat: 18.620, minLon: 73.900, maxLon: 73.960 },

  // CENTRAL
  "Camp": { minLat: 18.505, maxLat: 18.530, minLon: 73.860, maxLon: 73.895 },
  "Swargate": { minLat: 18.480, maxLat: 18.505, minLon: 73.845, maxLon: 73.875 },
  "Shivajinagar": { minLat: 18.525, maxLat: 18.560, minLon: 73.830, maxLon: 73.865 },
  "Karve Road / Deccan": { minLat: 18.505, maxLat: 18.535, minLon: 73.830, maxLon: 73.865 },

  // WEST
  "Kothrud": { minLat: 18.485, maxLat: 18.525, minLon: 73.780, maxLon: 73.825 },
  "Warje": { minLat: 18.475, maxLat: 18.510, minLon: 73.800, maxLon: 73.840 },
  "Bavdhan": { minLat: 18.510, maxLat: 18.560, minLon: 73.770, maxLon: 73.825 },
  "Pashan": { minLat: 18.530, maxLat: 18.580, minLon: 73.770, maxLon: 73.820 },
  "Aundh": { minLat: 18.560, maxLat: 18.595, minLon: 73.785, maxLon: 73.830 },
  "Baner": { minLat: 18.555, maxLat: 18.590, minLon: 73.780, maxLon: 73.820 },
  "Balewadi": { minLat: 18.565, maxLat: 18.605, minLon: 73.760, maxLon: 73.800 },

  // PCMC / NORTH
  "Wakad": { minLat: 18.585, maxLat: 18.625, minLon: 73.750, maxLon: 73.800 },
  "Hinjewadi Phase 1": { minLat: 18.585, maxLat: 18.620, minLon: 73.700, maxLon: 73.755 },
  "Hinjewadi Phase 2": { minLat: 18.605, maxLat: 18.645, minLon: 73.685, maxLon: 73.735 },
  "Hinjewadi Phase 3": { minLat: 18.620, maxLat: 18.665, minLon: 73.675, maxLon: 73.720 },
  "Ravet": { minLat: 18.640, maxLat: 18.690, minLon: 73.740, maxLon: 73.790 },
  "Punawale": { minLat: 18.620, maxLat: 18.660, minLon: 73.760, maxLon: 73.810 },
  "Akurdi": { minLat: 18.650, maxLat: 18.685, minLon: 73.780, maxLon: 73.825 },
  "Chinchwad": { minLat: 18.625, maxLat: 18.670, minLon: 73.780, maxLon: 73.825 },
  "Pimpri": { minLat: 18.610, maxLat: 18.650, minLon: 73.800, maxLon: 73.840 },
  "Nigdi": { minLat: 18.650, maxLat: 18.690, minLon: 73.810, maxLon: 73.855 },
  "Bhosari": { minLat: 18.610, maxLat: 18.650, minLon: 73.855, maxLon: 73.905 },

  // SOUTH
  "Bibwewadi": { minLat: 18.470, maxLat: 18.500, minLon: 73.860, maxLon: 73.900 },
  "Marketyard": { minLat: 18.460, maxLat: 18.492, minLon: 73.850, maxLon: 73.880 },
  "Katraj": { minLat: 18.430, maxLat: 18.470, minLon: 73.830, maxLon: 73.875 },
  "Ambegaon": { minLat: 18.425, maxLat: 18.460, minLon: 73.835, maxLon: 73.870 },
  "Dhankawadi": { minLat: 18.455, maxLat: 18.490, minLon: 73.840, maxLon: 73.875 },
  "Undri": { minLat: 18.440, maxLat: 18.475, minLon: 73.900, maxLon: 73.950 },
  "Pisoli": { minLat: 18.430, maxLat: 18.465, minLon: 73.910, maxLon: 73.960 }
};


// =========================
// 3) ZONE RESOLVER (Simple classification)
// =========================

function resolveZone(postal) {
  if (["411014","411015","411028","411036","411006","411047","412207","412307","412308"].includes(postal))
    return "East Pune";

  if (["411038","411029","411058","411052","411007","411045","411021"].includes(postal))
    return "West Pune";

  if (["411057","411033","411017","411019","411035","411044","411039","412101"].includes(postal))
    return "North Pune (PCMC / Hinjewadi)";

  if (["411037","411046","411043","411060"].includes(postal))
    return "South Pune";

  return "Pune";
}


// =========================
// 4) GEO-GRID AREA MATCHER
// =========================

function resolveAreaLatLong(lat, lon) {
  if (!lat || !lon) return null;

  for (const [area, box] of Object.entries(GEO_GRID)) {
    if (
      lat >= box.minLat && lat <= box.maxLat &&
      lon >= box.minLon && lon <= box.maxLon
    ) {
      return area;
    }
  }

  return null;
}


// =========================
// 5) FINAL AREA RESOLVER (PIN → GEO GRID → CITY fallback)
// =========================

function resolveArea(postal, city, lat, lon) {
  if (areaMap[postal]) return areaMap[postal];

  const geoArea = resolveAreaLatLong(lat, lon);
  if (geoArea) return geoArea;

  if (city === "Pune") return "Pune (Approx)";
  return city || "Pune";
}


// =========================
// 6) MAIN CLOUDFLARE HANDLER
// =========================

export async function onRequest({ request }) {
  const cf = request.cf || {};

  const ip     = request.headers.get("cf-connecting-ip");
  const city   = cf.city || "Pune";
  const postal = cf.postalCode || null;
  const region = cf.region || "Maharashtra";
  const lat    = cf.latitude || null;
  const lon    = cf.longitude || null;

  const area = resolveArea(postal, city, lat, lon);
  const zone = resolveZone(postal);

  return new Response(
    JSON.stringify({ ip, city, postal, region, lat, lon, area, zone }),
    { headers: { "Content-Type": "application/json" } }
  );
}
