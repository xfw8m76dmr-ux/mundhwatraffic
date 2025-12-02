// V2 Pune Geo Resolver — Cloudflare Worker (polygon + nearest fallback + confidence + heuristics)
//
// Usage: same as before — export async function onRequest({ request }) { ... }
// Paste this file as your Cloudflare Worker script.

const AREA_POLYGONS = {
  // For brevity: polygons are rectangles (clockwise) derived from your bounding boxes.
  // You can replace these with real multi-vertex polygons if you have them.
  "Kharadi": {
    polygon: [
      [18.545, 73.940],
      [18.545, 73.982],
      [18.575, 73.982],
      [18.575, 73.940]
    ]
  },
  "Viman Nagar": {
    polygon: [
      [18.560, 73.890],
      [18.560, 73.920],
      [18.585, 73.920],
      [18.585, 73.890]
    ]
  },
  "Wadgaon Sheri": {
    polygon: [
      [18.545, 73.918],
      [18.545, 73.940],
      [18.573, 73.940],
      [18.573, 73.918]
    ]
  },
  "Mundhwa": {
    polygon: [
      [18.521, 73.935],
      [18.521, 73.970],
      [18.548, 73.970],
      [18.548, 73.935]
    ]
  },
  "Keshav Nagar": {
    polygon: [
      [18.530, 73.960],
      [18.530, 73.990],
      [18.560, 73.990],
      [18.560, 73.960]
    ]
  },
  "Hadapsar": {
    polygon: [
      [18.490, 73.910],
      [18.490, 73.960],
      [18.530, 73.960],
      [18.530, 73.910]
    ]
  },
  "Manjari": {
    polygon: [
      [18.470, 73.970],
      [18.470, 74.010],
      [18.500, 74.010],
      [18.500, 73.970]
    ]
  },
  "Phursungi": {
    polygon: [
      [18.460, 73.940],
      [18.460, 73.980],
      [18.492, 73.980],
      [18.492, 73.940]
    ]
  },
  "Wagholi": {
    polygon: [
      [18.575, 73.980],
      [18.575, 74.050],
      [18.620, 74.050],
      [18.620, 73.980]
    ]
  },
  "Lohegaon": {
    polygon: [
      [18.580, 73.900],
      [18.580, 73.960],
      [18.620, 73.960],
      [18.620, 73.900]
    ]
  },

  // ... add other areas similarly (converted from your GEO_GRID)
  "Camp": {
    polygon: [
      [18.505, 73.860],
      [18.505, 73.895],
      [18.530, 73.895],
      [18.530, 73.860]
    ]
  },
  "Kothrud": {
    polygon: [
      [18.485, 73.780],
      [18.485, 73.825],
      [18.525, 73.825],
      [18.525, 73.780]
    ]
  },
  "Bibwewadi": {
    polygon: [
      [18.470, 73.860],
      [18.470, 73.900],
      [18.500, 73.900],
      [18.500, 73.860]
    ]
  }
  // add remaining areas as needed...
};

// Precompute centroids for nearest fallback
for (const [name, obj] of Object.entries(AREA_POLYGONS)) {
  const poly = obj.polygon;
  const centroid = polygonCentroid(poly);
  obj.centroid = centroid; // [lat, lon]
}

// KEEP your PIN -> area map (only accepts known PINs)
const PIN_AREA = {
  "411014": "Kharadi",
  "411015": "Viman Nagar",
  "411028": "Hadapsar",
  "411036": "Mundhwa",
  "411006": "Yerwada",
  "411047": "Lohegaon",
  "412207": "Wagholi",
  "412307": "Manjari",
  "412308": "Phursungi",
  "411001": "Camp",
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

// Small helpers
function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function polygonCentroid(poly) {
  // poly: array of [lat, lon]
  // simple average centroid — adequate for small polygons inside city
  let sumLat = 0, sumLon = 0;
  for (const [lat, lon] of poly) { sumLat += lat; sumLon += lon; }
  return [sumLat / poly.length, sumLon / poly.length];
}

// Point-in-polygon (ray casting) — point: [lat, lon], poly: [[lat, lon], ...]
function pointInPolygon(point, poly) {
  const x = point[1]; // lon
  const y = point[0]; // lat
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][1], yi = poly[i][0];
    const xj = poly[j][1], yj = poly[j][0];
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Haversine distance in meters
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // m
  const toRad = (d) => d * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Choose best match given postal, lat, lon, city
function resolveAreaV2({ postal, city, lat, lon, cf, headers }) {
  // Normalize
  const latN = toNum(lat);
  const lonN = toNum(lon);
  const postalStr = postal ? String(postal).trim() : null;

  // Heuristics for probable private relay/vpn (explanatory)
  const probable_private_relay = (!postalStr && (latN === null || lonN === null) && !!city);
  // basic VPN/proxy heuristic: postal exists but lat/lon missing OR x-forwarded-for contains multiple IPs
  const xff = headers.get("x-forwarded-for") || "";
  const probable_vpn_or_proxy = (postalStr && (latN === null || lonN === null)) || (xff.split(",").length > 1);

  // 1) PIN exact match (trusted)
  if (postalStr && PIN_AREA[postalStr]) {
    return {
      area: PIN_AREA[postalStr],
      method: "pin",
      confidence: "high",
      matched_pin: postalStr,
      distance_meters: null
    };
  }

  // 2) polygon containment (if lat/lon available)
  if (latN !== null && lonN !== null) {
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

    // 3) nearest-area fallback (compute distance to centroids)
    let best = null;
    for (const [area, obj] of Object.entries(AREA_POLYGONS)) {
      const [cLat, cLon] = obj.centroid;
      const d = haversineMeters(latN, lonN, cLat, cLon);
      if (!best || d < best.distance) best = { area, distance: d };
    }
    if (best) {
      // convert to confidence by distance thresholds
      let confidence = "low";
      if (best.distance <= 500) confidence = "high";       // within 500m => high
      else if (best.distance <= 2000) confidence = "medium"; // within 2km => medium
      else confidence = "low";

      return {
        area: best.area,
        method: "nearest",
        confidence,
        matched_pin: null,
        distance_meters: Math.round(best.distance)
      };
    }
  }

  // 4) City fallback
  if (city === "Pune") {
    return {
      area: "Pune (Approx)",
      method: "city",
      confidence: "low",
      matched_pin: null,
      distance_meters: null
    };
  }

  // 5) Last resort: return city or generic Pune
  return {
    area: city || "Pune",
    method: "fallback",
    confidence: "low",
    matched_pin: null,
    distance_meters: null
  };
}

// Format GA4-friendly user_properties
function makeGA4UserProperties(result) {
  // result: { area, method, confidence, matched_pin, distance_meters }
  return {
    user_area: result.area,
    user_area_method: result.method,
    user_area_confidence: result.confidence,
    user_area_distance_meters: result.distance_meters !== null ? String(result.distance_meters) : null
  };
}

// zone resolver (reuse your mapping — keep simple)
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


// --------------------------
// Cloudflare Worker handler
// --------------------------
export async function onRequest({ request }) {
  try {
    const cf = request.cf || {};
    const headers = request.headers;

    const ip     = request.headers.get("cf-connecting-ip") || null;
    const city   = cf.city || null;
    const postal = cf.postalCode || null;
    const region = cf.region || null;
    const lat    = cf.latitude || null;
    const lon    = cf.longitude || null;

    const heuristics = {
      probable_private_relay: (!postal && (!lat || !lon) && !!city),
      probable_vpn_or_proxy: (postal && (!lat || !lon)) || ((headers.get("x-forwarded-for") || "").split(",").length > 1)
    };

    const resolved = resolveAreaV2({ postal, city, lat, lon, cf, headers });

    const zone = resolveZone(postal);

    const ga4_props = makeGA4UserProperties(resolved);

    const payload = {
      ip,
      city,
      postal,
      region,
      latitude: lat === undefined ? null : lat,
      longitude: lon === undefined ? null : lon,
      area: resolved.area,
      zone,
      method: resolved.method,
      confidence: resolved.confidence,
      matched_pin: resolved.matched_pin,
      distance_meters: resolved.distance_meters,
      heuristics,
      ga4_user_properties: ga4_props,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    const errPayload = { error: String(err) };
    return new Response(JSON.stringify(errPayload, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
