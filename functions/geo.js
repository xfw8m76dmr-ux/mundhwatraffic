// =======================================================
//                     V3 — INDIA GEO RESOLVER
//             LAT/LON FIRST → PIN FALLBACK ONLY
// =======================================================

/*
V3 Priority:
1. Polygon match (Cloudflare lat/lon)
2. Nearest centroid fallback
3. PIN → only if lat/lon missing
4. City fallback
*/

const AREA_POLYGONS = {
  "Kharadi": { polygon: [[18.545,73.940],[18.545,73.982],[18.575,73.982],[18.575,73.940]] },
  "Viman Nagar": { polygon: [[18.560,73.890],[18.560,73.920],[18.585,73.920],[18.585,73.890]] },
  "Wadgaon Sheri": { polygon: [[18.545,73.918],[18.545,73.940],[18.573,73.940],[18.573,73.918]] },
  "Mundhwa": { polygon: [[18.521,73.935],[18.521,73.970],[18.548,73.970],[18.548,73.935]] },
  "Keshav Nagar": { polygon: [[18.530,73.960],[18.530,73.990],[18.560,73.990],[18.560,73.960]] },
  "Hadapsar": { polygon: [[18.490,73.910],[18.490,73.960],[18.530,73.960],[18.530,73.910]] },
  "Manjari": { polygon: [[18.470,73.970],[18.470,74.010],[18.500,74.010],[18.500,73.970]] },
  "Phursungi": { polygon: [[18.460,73.940],[18.460,73.980],[18.492,73.980],[18.492,73.940]] },
  "Wagholi": { polygon: [[18.575,73.980],[18.575,74.050],[18.620,74.050],[18.620,73.980]] },
  "Lohegaon": { polygon: [[18.580,73.900],[18.580,73.960],[18.620,73.960],[18.620,73.900]] },
  "Camp": { polygon: [[18.505,73.860],[18.505,73.895],[18.530,73.895],[18.530,73.860]] },
  "Kothrud": { polygon: [[18.485,73.780],[18.485,73.825],[18.525,73.825],[18.525,73.780]] },
  "Bibwewadi": { polygon: [[18.470,73.860],[18.470,73.900],[18.500,73.900],[18.500,73.860]] }
  // You can keep adding more polygons over time
};

// Compute centroids
function polygonCentroid(poly) {
  let sumLat = 0, sumLon = 0;
  for (const [lat, lon] of poly) { sumLat += lat; sumLon += lon; }
  return [sumLat / poly.length, sumLon / poly.length];
}

for (const area of Object.values(AREA_POLYGONS)) {
  area.centroid = polygonCentroid(area.polygon);
}

// PIN fallback mapping (used ONLY if lat/lon unavailable)
const PIN_AREA = {
  "411001": "Camp",
  "411002": "Sadashiv Peth",
  "411003": "Khadki",
  "411004": "Deccan Gymkhana",
  "411005": "Shivajinagar",
  "411006": "Yerwada",
  "411007": "Aundh",
  "411008": "Baner",
  "411009": "Parvati",
  "411011": "Kasba Peth",
  "411012": "Dapodi",
  "411013": "Hadapsar",
  "411014": "Kharadi",
  "411015": "Viman Nagar",
  "411016": "Model Colony",
  "411017": "Pimpri",
  "411018": "Pimpri",
  "411019": "Chinchwad",
  "411020": "Range Hills",
  "411021": "Bavdhan",
  "411022": "SRPF",
  "411023": "Agalambe",
  "411026": "Bhosari",
  "411027": "Sangavi",
  "411028": "Hadapsar",
  "411030": "Sadashiv Peth",
  "411031": "CME",
  "411032": "Airport",
  "411033": "Punawale",
  "411034": "Kasarwadi",
  "411035": "Akurdi",
  "411036": "Mundhwa",
  "411037": "Bibwewadi",
  "411038": "Kothrud",
  "411039": "Bhosari",
  "411040": "Wanowarie",
  "411041": "Dhayari",
  "411042": "Bhukum",
  "411044": "Yamunanagar",
  "411045": "Baner",
  "411046": "Ambegaon",
  "411047": "Lohegaon",
  "411048": "Kondhwa",
  "411051": "Anandnagar",
  "411052": "Karve Nagar",
  "411057": "Wakad",
  "411058": "Warje",
  "411060": "Undri",
  "411061": "Pimple Gurav",
  "411062": "Chikhali",
  // Rural (fallback only)
  "412207": "Wagholi",
  "412307": "Manjari",
  "412308": "Phursungi",
};

// ---------------- Helpers ----------------
function toNum(v){ if(v===null||v===undefined)return null; const n=Number(v); return Number.isFinite(n)?n:null; }

function pointInPolygon(point, poly) {
  const [lat, lon] = point;  
  let inside = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const [latI,lonI]=poly[i], [latJ,lonJ]=poly[j];
    const intersect = ((lonI>lon)!==(lonJ>lon)) &&
      lat < (latJ-latI)*(lon-lonI)/(lonJ-lonI) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R=6371000; const toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ------------- V3 Resolver ---------------
function resolveAreaV3({ postal, city, lat, lon }) {
  const latN = toNum(lat);
  const lonN = toNum(lon);
  const postalStr = postal ? String(postal).trim() : null;

  // -------------------------------
  // 1) If lat/lon available → ALWAYS USE LAT/LON FIRST
  // -------------------------------
  if (latN !== null && lonN !== null) {

    // 1a) Polygon match
    for (const [area, obj] of Object.entries(AREA_POLYGONS)) {
      if (pointInPolygon([latN, lonN], obj.polygon)) {
        return {
          area,
          method: "polygon",
          confidence: "high",
          matched_pin: null,
          distance_meters: 0
        };
      }
    }

    // 1b) Nearest centroid fallback
    let best = null;
    for (const [area, obj] of Object.entries(AREA_POLYGONS)) {
      const [cLat,cLon] = obj.centroid;
      const d = haversine(latN, lonN, cLat, cLon);
      if (!best || d < best.distance) best = {area, distance: d};
    }

    let conf = "low";
    if (best.distance <= 600) conf = "high";
    else if (best.distance <= 2000) conf = "medium";

    return {
      area: best.area,
      method: "nearest",
      confidence: conf,
      matched_pin: null,
      distance_meters: Math.round(best.distance),
    };
  }

  // -------------------------------
  // 2) Only if lat/lon missing → use PIN
  // -------------------------------
  if (postalStr && PIN_AREA[postalStr]) {
    return {
      area: PIN_AREA[postalStr],
      method: "pin",
      confidence: "medium",
      matched_pin: postalStr,
      distance_meters: null
    };
  }

  // -------------------------------
  // 3) City fallback
  // -------------------------------
  if (city === "Pune") {
    return {
      area: "Pune (Approx)",
      method: "city",
      confidence: "low",
      matched_pin: null,
      distance_meters: null
    };
  }

  // -------------------------------
  // 4) Last fallback
  // -------------------------------
  return {
    area: city || "Pune",
    method: "fallback",
    confidence: "low",
    matched_pin: null,
    distance_meters: null
  };
}

// ---------------- Cloudflare Handler ----------------

export async function onRequest({ request }) {
  const cf = request.cf || {};
  const headers = request.headers;

  const ip     = headers.get("cf-connecting-ip");
  const city   = cf.city || null;
  const postal = cf.postalCode || null;
  const region = cf.region || null;
  const lat    = cf.latitude || null;
  const lon    = cf.longitude || null;

  const result = resolveAreaV3({ postal, city, lat, lon });

  const payload = {
    ip,
    city,
    postal,
    region,
    latitude: lat,
    longitude: lon,
    ...result,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
