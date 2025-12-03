// V4 — INDIA GEO RESOLVER (Cloudflare Worker-compatible)
// Priority:
// 1) Polygon (micro-polygons -> parent area)
// 2) Min-distance-to-polygon (edge distance) with ISP bias & continuous confidence
// 3) Nearest centroid fallback (improved scoring)
// 4) PIN fallback only if lat/lon missing
// 5) City fallback

// ---------------- CONFIG / DATA ----------------

// Top-level areas (parents) & wafer-micropolygons for improved polygon hit-rate
const AREA_POLYGONS = {
  // Parent polygons (coarse)
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
  "Bibwewadi": { polygon: [[18.470,73.860],[18.470,73.900],[18.500,73.900],[18.500,73.860]] },

  // ---- wafer / micro-polygons (small rectangles inside parents) ----
  // These help match cases where Cloudflare lat/lon is slightly off.
  // Each micro polygon should map to a parent area using `parent` property.
  "Kharadi-SE": { parent: "Kharadi", polygon: [[18.548,73.952],[18.548,73.970],[18.563,73.970],[18.563,73.952]] },
  "Kharadi-NE": { parent: "Kharadi", polygon: [[18.560,73.952],[18.560,73.982],[18.575,73.982],[18.575,73.952]] },

  "Viman-Inner": { parent: "Viman Nagar", polygon: [[18.564,73.895],[18.564,73.910],[18.578,73.910],[18.578,73.895]] },

  "Hadapsar-West": { parent: "Hadapsar", polygon: [[18.495,73.915],[18.495,73.935],[18.515,73.935],[18.515,73.915]] },

  "Mundhwa-South": { parent: "Mundhwa", polygon: [[18.525,73.945],[18.525,73.960],[18.540,73.960],[18.540,73.945]] },

  "Lohegaon-NW": { parent: "Lohegaon", polygon: [[18.585,73.905],[18.585,73.925],[18.600,73.925],[18.600,73.905]] },

  "Wagholi-South": { parent: "Wagholi", polygon: [[18.580,73.990],[18.580,74.020],[18.600,74.020],[18.600,73.990]] },

  "Bibwewadi-N": { parent: "Bibwewadi", polygon: [[18.480,73.870],[18.480,73.890],[18.495,73.890],[18.495,73.870]] }
};

// Compute centroids for all parent areas (and micro-polygons too, used for tie-breaks)
function polygonCentroid(poly) {
  let sumLat = 0, sumLon = 0;
  for (const [lat, lon] of poly) { sumLat += lat; sumLon += lon; }
  return [sumLat / poly.length, sumLon / poly.length];
}
for (const key of Object.keys(AREA_POLYGONS)) {
  const obj = AREA_POLYGONS[key];
  obj.centroid = polygonCentroid(obj.polygon);
}

// PIN fallback mapping (used ONLY if lat/lon missing)
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
  "411013": "HadapsarIE",
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
function toNum(v){ if (v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }

// Ray-casting point-in-polygon (lat,lon)
function pointInPolygon(point, poly) {
  const [lat, lon] = point;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [latI, lonI] = poly[i];
    const [latJ, lonJ] = poly[j];
    const intersect = ((lonI > lon) !== (lonJ > lon)) &&
      (lat < (latJ - latI) * (lon - lonI) / (lonJ - lonI + 1e-12) + latI);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Haversine (meters) — safe for small distances we use here
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Convert lat/lon differences to planar meters using equirectangular approx around lat0
function latLonToXYMeters(lat0, lat, lon0, lon) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const x = toRad(lon - lon0) * Math.cos(toRad((lat + lat0) / 2)) * R;
  const y = toRad(lat - lat0) * R;
  return [x, y];
}

// Distance from point to segment (lat/lon) in meters using planar projection
function pointToSegmentDistanceMeters(ptLat, ptLon, aLat, aLon, bLat, bLon) {
  // project around ptLat to keep small errors tiny
  const [ax, ay] = latLonToXYMeters(ptLat, aLat, ptLon, aLon);
  const [bx, by] = latLonToXYMeters(ptLat, bLat, ptLon, bLon);
  const px = 0, py = 0; // point at origin by design

  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const vv = vx * vx + vy * vy;
  if (vv === 0) {
    // a === b
    return Math.hypot(px - ax, py - ay);
  }
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / vv));
  const projx = ax + t * vx, projy = ay + t * vy;
  return Math.hypot(px - projx, py - projy);
}

// Minimum distance from point to polygon edges (meters)
function minDistanceToPolygonMeters(lat, lon, poly) {
  let minD = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [latI, lonI] = poly[i];
    const [latJ, lonJ] = poly[j];
    const d = pointToSegmentDistanceMeters(lat, lon, latI, lonI, latJ, lonJ);
    if (d < minD) minD = d;
  }
  return minD;
}

// ---------------- ISP BIAS / CONFIDENCE ----------------

// Simple ISP bias map based on asOrganization / asn substring match.
// This is intentionally simple and non-private (no lookups). We just map known strings to tendency factors.
// factor >1 increases expected error (makes distances appear larger), factor <1 reduces.
function ispBiasFactor(asOrgStr) {
  if (!asOrgStr) return 1.0;
  const s = String(asOrgStr).toLowerCase();
  if (s.includes("jio") || s.includes("reliance")) return 2.0;     // Jio often coarse
  if (s.includes("vodafone") || s.includes("vi") || s.includes("idea")) return 1.8;
  if (s.includes("hathway") || s.includes("you") || s.includes("den") ) return 1.4;
  if (s.includes("act") || s.includes("ethersurf") || s.includes("spectra")) return 1.2;
  if (s.includes("airtel")) return 1.15;
  // default
  return 1.0;
}

// Continuous confidence mapping
function confidenceFromScore(score) {
  // score expected in [0,1]
  if (score >= 0.75) return "high";
  if (score >= 0.40) return "medium";
  return "low";
}

// ---------------- Resolver V4 ----------------
function resolveAreaV4({ postal, city, lat, lon, asOrg }) {
  const latN = toNum(lat);
  const lonN = toNum(lon);
  const postalStr = postal ? String(postal).trim() : null;

  // If we have lat/lon, use advanced lat/lon-first path
  if (latN !== null && lonN !== null) {
    // 1) Direct polygon (micro polygons included). If matched, return parent area (if micro).
    for (const [key, obj] of Object.entries(AREA_POLYGONS)) {
      if (pointInPolygon([latN, lonN], obj.polygon)) {
        const area = obj.parent || key;
        return {
          area,
          method: "polygon",
          confidence: "high",
          matched_pin: null,
          distance_meters: 0
        };
      }
    }

    // 2) Min-distance scoring across polygons (edge distance is better than centroid)
    // Compute min distance to each polygon and keep best N candidates
    let candidates = [];
    for (const [key, obj] of Object.entries(AREA_POLYGONS)) {
      const d = Math.round(minDistanceToPolygonMeters(latN, lonN, obj.polygon));
      // store parent info: if micro polygon has parent, prefer parent name
      const parent = obj.parent || key;
      candidates.push({ key, parent, distance: d, centroid: obj.centroid });
    }

    // Sort by distance asc
    candidates.sort((a, b) => a.distance - b.distance);

    // ISP bias factor adjusts expected error: multiply measured distance to reflect ISP clustering
    const ispFactor = ispBiasFactor(asOrg);

    // baseRange influences how quickly confidence decays. tuned for city-level clusters.
    const baseRangeMeters = 3500; // typical ISP cluster radius baseline

    // compute confidence score for best candidate (continuous)
    const best = candidates[0];
    // scaledDistance = observedDistance * ispFactor
    const scaledDistance = best.distance * ispFactor;
    const rawScore = Math.max(0, 1 - (scaledDistance / baseRangeMeters)); // 1 -> perfect, 0 -> far
    const confidence = confidenceFromScore(rawScore);

    // Additional heuristics: if second candidate close to first (tie), drop confidence a bit
    let tiePenalty = 0;
    if (candidates.length > 1) {
      const second = candidates[1];
      // if second is within 800m of first, it's ambiguous
      if (second.distance - best.distance < 800) tiePenalty = 0.15;
      // if second is extremely close (< 400m), more penalty
      if (second.distance - best.distance < 400) tiePenalty = 0.25;
    }

    const adjustedScore = Math.max(0, rawScore - tiePenalty);
    const adjustedConfidence = confidenceFromScore(adjustedScore);

    // If the best distance is very small, promote to high regardless of ispFactor noise
    if (best.distance <= 300) {
      return {
        area: best.parent,
        method: "min_distance",
        confidence: "high",
        matched_pin: null,
        distance_meters: best.distance
      };
    }

    // If moderate distance, but high rawScore -> medium/high accordingly
    return {
      area: best.parent,
      method: "min_distance",
      confidence: adjustedConfidence,
      matched_pin: null,
      distance_meters: best.distance
    };
  }

  // If lat/lon missing: use PIN fallback
  if (postalStr && PIN_AREA[postalStr]) {
    return {
      area: PIN_AREA[postalStr],
      method: "pin",
      confidence: "medium",
      matched_pin: postalStr,
      distance_meters: null
    };
  }

  // City fallback
  if (city === "Pune") {
    return {
      area: "Pune (Approx)",
      method: "city",
      confidence: "low",
      matched_pin: null,
      distance_meters: null
    };
  }

  // final fallback
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

  // Cloudflare provides several fields; we attempt to use asOrganization / asn if present
  const ip     = headers.get("cf-connecting-ip");
  const city   = cf.city || null;
  const postal = cf.postalCode || null;
  const region = cf.region || null;
  const lat    = cf.latitude || null;
  const lon    = cf.longitude || null;
  // cf.asOrganization is available in some CF environments; cf.asn sometimes exists
  const asOrg  = cf.asOrganization || cf.asn || null;

  const result = resolveAreaV4({ postal, city, lat, lon, asOrg });

  const payload = {
    ip,
    city,
    postal,
    region,
    latitude: lat,
    longitude: lon,
    asOrganization: asOrg,
    ...result,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
