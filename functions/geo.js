// V2 Pune Geo Resolver — Cloudflare Worker (polygon + nearest fallback + confidence + heuristics)
//
// NOTE: This is the same V2 we produced earlier but with an expanded PIN_AREA mapping
// that includes the postal codes and locality names you supplied.

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
  // add more polygons later as desired...
};

// Precompute centroids
for (const [name, obj] of Object.entries(AREA_POLYGONS)) {
  const poly = obj.polygon;
  const centroid = polygonCentroid(poly);
  obj.centroid = centroid;
}

// -----------------
// Expanded PIN_AREA
// -----------------
// Integrated the postal descriptions you provided. Keys are postal codes (strings).
// Values are normalized area names that match or map to polygon keys when possible.
// I've preserved descriptive localities (after the comma) as comments for reference.
const PIN_AREA = {
  // core city codes (from your list)
  "411001": "Camp",               // Pune H.O., C.D.A. (O), Dr. B.A. Chowk, Ghorpuri Bazar, Pune Cantt East, Pune New Bazar, Sachapir Street, Agarkar Nagar
  "411002": "Sadashiv Peth",      // Pune City, Bajirao Road, Kapad Ganj, Nana Peth, Raviwar Peth, Shukrawar Peth, M.Fule market, Ashok Nagar Colony
  "411003": "Khadki",             // Ammunition Factory Khadki, East Khadki, H.E. Factory, Khadki Bazar, Botanical Garden
  "411004": "Deccan Gymkhana",    // A.R. Shala, Deccan Gymkhana, Film Institute
  "411005": "Shivajinagar",       // Congress House Road, S.S.C. Exam Board, Shivajinagar
  "411006": "Yerwada",            // Yerwada, Yerwada T.S.
  "411007": "Aundh",              // Aundh, Ganeshkhind, Ashok Nagar
  "411008": "Baner",              // Baner Road
  "411009": "Parvati",            // Parvati, Parvati Gaon
  "411011": "Kasba Peth",         // Kasba Peth, Mangalwar Peth, Rasta Peth
  "411012": "Dapodi",             // Dapodi, Dapodi Bazar
  "411013": "HADAPSAR-IND",       // Hadapsar I.E. (industrial)
  "411014": "Kharadi",            // 9 DRD, Dukirkline, Vadgaon Sheri, Viman Nagar, Kharadi
  "411015": "Viman Nagar",        // Dhanori, Dighi Camp, Vishrantwadi
  "411016": "Model Colony",       // Gokhalenagar, Govt. Polytechnic, Model Colony, Shivaji Housing Society
  "411017": "Pimpri",             // Kalewadi, Pimpri Colony, Pimpri Waghire
  "411018": "Pimpri",             // Masulkar Colony, Nehrunagar, Pimpri P F
  "411019": "Chinchwad",          // Chinchwad East
  "411020": "Range Hills",
  "411021": "Bavdhan",            // Armament, Bavdhan, Sus
  "411022": "SRPF",               // SRPF
  "411023": "Agalambe",
  "411026": "Bhosari",            // Bhosari I.E., Indrayaninagar
  "411027": "Sangavi",            // Aundh Camp, Sangavi
  "411028": "Hadapsar",           // Gondhale Nagar, Hadapsar, Sasanenagar
  "411030": "Sadashiv Peth",      // Lokmanyanagar, Narayan Peth, S.P. College, Sadashiv Peth, Shaniwar Peth
  "411031": "CME",
  "411032": "Airport",            // Airport, IAF Station, Vidyanagar
  "411033": "Punawale",           // Chinchwadgaon, Jambhe, Punawale, Thathawade, Thergaon
  "411034": "Kasarwadi",
  "411035": "Akurdi",
  "411036": "Mundhwa",            // Mundhwa, Mundhwa AV
  "411037": "Bibwewadi",          // Bibwewadi, Market Yard, Salisbury Park, T.V. Nagar
  "411038": "Kothrud",            // Bhusari Colony, Ex. Serviceman Colony, Kothrud
  "411039": "Bhosari-Goan",
  "411040": "Wanowarie",          // AFMC, Wanowarie
  "411041": "Dhayari",            // Dhayari, Nanded, Sinhgad Technical Education Society, Vadgaon Budruk
  "411042": "Bhukum",             // Bhavani Peth, Ghorpade Peth, Guruwar Peth, Ambarvet, Andgaon, Bhugaon, Bhukum, Ghotavade
  "411044": "Yamunanagar",        // P.C.N.T., Yamunanagar
  "411045": "Baner",              // Baner Gaon
  "411046": "Ambegaon",           // Ambegaon Bk, Ambegaon Budruk, Ambegaon Pathar
  "411047": "Lohegaon",
  "411048": "Kondhwa",            // Khondhwa KH, Kondhwa BK, Kondhwa Lh, N.I.B.M.
  "411051": "Anandnagar",
  "411052": "Karve Nagar",        // Karvenagar, Navsahyadri
  "411057": "Wakad",              // Infotech Park Hinjewadi, Marunji, Wakad
  "411058": "Warje",
  "411060": "Undri",              // Mohamadwadi (Undri / Pisoli area)
  "411061": "Pimple Gurav",
  "411062": "Chikhali",
  // Pune Rural / Taluka examples you provided (added where clear)
  "410506": "Maval",              // Adhale Bk, Chandkhed, Bebedhol
  "410401": "Maval",              // Ambavane, Bhangarwadi
  "410402": "Maval",
  "410507": "Maval",              // Ambale, Ambi
  "410509": "Maval",              // Adivare, Asane, Bhimashankar, Dimbhe Colony
  "410505": "Maval",              // Amboli
  "410511": "Maval",
  "410512": "Maval",
  "410513": "Maval",              // Bibi, Chas
  "410516": "Maval",              // Gangapur Kh
  "412115": "Mulshi",             // Mulshi Taluka
  "412210": "Shirur",
  "412207": "Wagholi",            // Ashtapur, Awhalwadi, Wagholi
  "412211": "Shirur",             // Alegaon, Amble, Andhalgaon, Chinchani Camp
  "412208": "Shirur",             // Burunjwadi
  "412209": "Shirur",             // Bhamburde, Ganegaon Khalasa
  "412216": "Shirur",             // Fulgaon
  "412218": "Shirur",             // Amdahad
  "412305": "Purandar",
  "412301": "Purandar",           // Bhivadi, Bhivari, Bopgaon, Chambli, Diwa...
  "412303": "Purandar",
  "412212": "Velha",
  "410503": "Ambegaon",
  "412408": "Ambegaon",
  "412406": "Ambegaon",
  "412405": "Ambegaon",
  "412404": "Ambegaon",
  "412402": "Ambegaon",
  "412409": "Ambegaon",
  "412410": "Ambegaon",
  "413801": "Daund",
  "413802": "Daund",
  "413803": "Daund",
  "413102": "Baramati",
  "413103": "Baramati",
  "413104": "Baramati",
  "413133": "Baramati",
  "413106": "Indapur",
  "413130": "Indapur",
  "413105": "Indapur",
  "413132": "Indapur",
  "413114": "Indapur",
  "410502": "Junnar",
  "412401": "Junnar",
  "412411": "Junnar",
  "412412": "Junnar",
  "410501": "Khed",
  "412105": "Khed",
  "412114": "Khed",
  "412202": "Khed",
  "412203": "Khed"
  // You can continue adding more postal codes here as needed
};

// ---------- same helper functions as earlier ----------
function toNum(v) { if (v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function polygonCentroid(poly) { let sumLat = 0, sumLon = 0; for (const [lat, lon] of poly) { sumLat += lat; sumLon += lon; } return [sumLat / poly.length, sumLon / poly.length]; }
function pointInPolygon(point, poly) {
  const x = point[1], y = point[0];
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][1], yi = poly[i][0];
    const xj = poly[j][1], yj = poly[j][0];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; const toRad = (d) => d * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Precompute centroids for polygons
for (const [name, obj] of Object.entries(AREA_POLYGONS)) {
  obj.centroid = polygonCentroid(obj.polygon);
}

function resolveAreaV2({ postal, city, lat, lon, cf, headers }) {
  const latN = toNum(lat);
  const lonN = toNum(lon);
  const postalStr = postal ? String(postal).trim() : null;

  const probable_private_relay = (!postalStr && (latN === null || lonN === null) && !!city);
  const xff = headers.get("x-forwarded-for") || "";
  const probable_vpn_or_proxy = (postalStr && (latN === null || lonN === null)) || (xff.split(",").length > 1);

  // 1) PIN exact match
  if (postalStr && PIN_AREA[postalStr]) {
    return { area: PIN_AREA[postalStr], method: "pin", confidence: "high", matched_pin: postalStr, distance_meters: null };
  }

  // 2) polygon containment
  if (latN !== null && lonN !== null) {
    for (const [area, obj] of Object.entries(AREA_POLYGONS)) {
      if (pointInPolygon([latN, lonN], obj.polygon)) {
        return { area, method: "polygon", confidence: "high", matched_pin: null, distance_meters: 0 };
      }
    }

    // 3) nearest-area fallback
    let best = null;
    for (const [area, obj] of Object.entries(AREA_POLYGONS)) {
      const [cLat, cLon] = obj.centroid;
      const d = haversineMeters(latN, lonN, cLat, cLon);
      if (!best || d < best.distance) best = { area, distance: d };
    }
    if (best) {
      let confidence = "low";
      if (best.distance <= 500) confidence = "high";
      else if (best.distance <= 2000) confidence = "medium";
      else confidence = "low";
      return { area: best.area, method: "nearest", confidence, matched_pin: null, distance_meters: Math.round(best.distance) };
    }
  }

  if (city === "Pune") return { area: "Pune (Approx)", method: "city", confidence: "low", matched_pin: null, distance_meters: null };
  return { area: city || "Pune", method: "fallback", confidence: "low", matched_pin: null, distance_meters: null };
}

function makeGA4UserProperties(result) {
  return {
    user_area: result.area,
    user_area_method: result.method,
    user_area_confidence: result.confidence,
    user_area_distance_meters: result.distance_meters !== null ? String(result.distance_meters) : null
  };
}

function resolveZone(postal) {
  if (["411014","411015","411028","411036","411006","411047","412207","412307","412308"].includes(postal)) return "East Pune";
  if (["411038","411029","411058","411052","411007","411045","411021"].includes(postal)) return "West Pune";
  if (["411057","411033","411017","411019","411035","411044","411039","412101"].includes(postal)) return "North Pune (PCMC / Hinjewadi)";
  if (["411037","411046","411043","411060"].includes(postal)) return "South Pune";
  return "Pune";
}

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
