// =======================================================
//                     V5 — INDIA GEO RESOLVER
//         WITH MOBILE NAT DETECTION + ISP BIAS FIXES
//  Boost accuracy, prevent false "high" confidence errors
// =======================================================

// ---------------------- POLYGONS ------------------------
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
  "Bibwewadi": { polygon: [[18.470,73.860],[18.470,73.900],[18.500,73.900],[18.500,73.860]] },

  // ---- MICRO / WAFER POLYGONS ----
  "Kharadi-SE": { parent: "Kharadi", polygon: [[18.548,73.952],[18.548,73.970],[18.563,73.970],[18.563,73.952]] },
  "Kharadi-NE": { parent: "Kharadi", polygon: [[18.560,73.952],[18.560,73.982],[18.575,73.982],[18.575,73.952]] },
  "Viman-Inner": { parent: "Viman Nagar", polygon: [[18.564,73.895],[18.564,73.910],[18.578,73.910],[18.578,73.895]] },
  "Hadapsar-West": { parent: "Hadapsar", polygon: [[18.495,73.915],[18.495,73.935],[18.515,73.935],[18.515,73.915]] },
  "Mundhwa-South": { parent: "Mundhwa", polygon: [[18.525,73.945],[18.525,73.960],[18.540,73.960],[18.540,73.945]] },
  "Lohegaon-NW": { parent: "Lohegaon", polygon: [[18.585,73.905],[18.585,73.925],[18.600,73.925],[18.600,73.905]] },
  "Wagholi-South": { parent: "Wagholi", polygon: [[18.580,73.990],[18.580,74.020],[18.600,74.020],[18.600,73.990]] },
  "Bibwewadi-N": { parent: "Bibwewadi", polygon: [[18.480,73.870],[18.480,73.890],[18.495,73.890],[18.495,73.870]] }
};

// ----------------------- CENTROIDS -----------------------
function polygonCentroid(poly) {
  let sumLat = 0, sumLon = 0;
  for (const [lat, lon] of poly) { sumLat += lat; sumLon += lon; }
  return [sumLat / poly.length, sumLon / poly.length];
}
for (const k of Object.keys(AREA_POLYGONS)) {
  AREA_POLYGONS[k].centroid = polygonCentroid(AREA_POLYGONS[k].polygon);
}

// ----------------------- PIN MAPPING ----------------------
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
  "412207": "Wagholi",
  "412307": "Manjari",
  "412308": "Phursungi",
};

// ---------------------- HELPERS --------------------------
function toNum(v){ if(v===null||v===undefined)return null; const n=Number(v); return Number.isFinite(n)?n:null; }

function pointInPolygon([lat, lon], poly) {
  let inside = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const [latI,lonI]=poly[i], [latJ,lonJ]=poly[j];
    const intersect = ((lonI>lon)!==(lonJ>lon)) &&
      lat < (latJ-latI)*(lon-lonI)/(lonJ-lonI+1e-12) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

function toRad(d){ return d*Math.PI/180; }
function haversine(lat1, lon1, lat2, lon2) {
  const R=6371000;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 +
          Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
          Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ---------------- MOBILE NAT DETECTION -------------------
const CLUSTER_COORDS = [
  { label: "pune_city_center", lat: 18.51957, lon: 73.85535, radius: 900 },
  { label: "yerwada_hub",       lat: 18.5583,  lon: 73.8875,  radius: 900 },
  { label: "hinjawadi_hub",     lat: 18.5915,  lon: 73.7381,  radius: 1200 },
];

const MOBILE_ASN_PATTERNS = [ "as55836", "as9498", "as55410", "as9829" ];
const MOBILE_ORG_SUBSTRS = [
  "reliance jio","jio","airtel","vodafone","vi ","vodafone-idea","bsnl mobile"
];
const WIRED_ORG_SUBSTRS = [
  "tata","tata play","tata communications",
  "hathway","you broadband","sify","railtel","spectra","den networks"
];

function norm(s){ return s ? String(s).toLowerCase() : ""; }

function detectMobileNat({lat,lon,asOrg,asn,userAgent}) {
  const latN = toNum(lat), lonN = toNum(lon);
  const ua = norm(userAgent);
  const org = norm(asOrg);
  const asnNorm = asn ? String(asn).toLowerCase() : "";

  let reasons = [];
  let penalty = 1;
  let unreliable = false;

  // cluster hits
  if(latN!==null && lonN!==null){
    for(const c of CLUSTER_COORDS){
      const d = haversine(latN,lonN,c.lat,c.lon);
      if(d<=c.radius){
        reasons.push("cluster:" + c.label);
        penalty = 0.35;
        unreliable = true;
        break;
      }
    }
  }

  const uaMobile = /android|iphone|mobile/i.test(ua);
  const orgWired = WIRED_ORG_SUBSTRS.some(s=>org.includes(s));
  const orgMobile = MOBILE_ORG_SUBSTRS.some(s=>org.includes(s));
  const asnMobile = MOBILE_ASN_PATTERNS.some(s=>asnNorm.includes(s));

  if(uaMobile && orgWired){
    reasons.push("ua_mobile_but_org_wired");
    penalty = Math.min(penalty,0.40);
    unreliable = true;
  }

  if(uaMobile && !asnMobile && !orgMobile){
    reasons.push("ua_mobile_asn_not_mobile");
    penalty = Math.min(penalty,0.50);
    unreliable = true;
  }

  return { unreliable, penalty, reasons, methodHint: unreliable ? "cluster_fallback":"latlon_ok" };
}

function confidenceFromScore(s){
  if(s>=0.75) return "high";
  if(s>=0.40) return "medium";
  return "low";
}

// ---------------- RESOLVER V5 ----------------------------
function resolveAreaV5({ postal, city, lat, lon, asOrg, asn, userAgent }) {
  const latN = toNum(lat);
  const lonN = toNum(lon);
  const postalStr = postal ? String(postal).trim() : null;

  // ------------- LAT/LON PATH -------------
  if(latN!==null && lonN!==null){

    // A) POLYGON MATCH
    for(const [key,obj] of Object.entries(AREA_POLYGONS)){
      if(pointInPolygon([latN,lonN],obj.polygon)){
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

    // B) MIN DISTANCE TO POLYGONS
    let candidates=[];
    for(const [key,obj] of Object.entries(AREA_POLYGONS)){
      const dist = Math.round(
        haversine(latN,lonN,obj.centroid[0],obj.centroid[1])
      );
      candidates.push({
        parent: obj.parent || key,
        distance: dist
      });
    }
    candidates.sort((a,b)=>a.distance-b.distance);
    const best = candidates[0];

    let rawScore = Math.max(0, 1 - (best.distance / 3500));

    // MOBILE NAT CHECK
    const nat = detectMobileNat({lat,lon,asOrg,asn,userAgent});
    if(nat.unreliable){
      rawScore = rawScore * nat.penalty;
    }

    const conf = confidenceFromScore(rawScore);

    return {
      area: best.parent,
      method: nat.methodHint === "cluster_fallback" ? "cluster_fallback" : "min_distance",
      confidence: conf,
      matched_pin: null,
      distance_meters: best.distance,
      nat_reasons: nat.reasons
    };
  }

  // ------------- PIN FALLBACK -------------
  if(postalStr && PIN_AREA[postalStr]){
    return {
      area: PIN_AREA[postalStr],
      method: "pin",
      confidence: "medium",
      matched_pin: postalStr
    };
  }

  // ------------- CITY FALLBACK -------------
  if(city==="Pune"){
    return {
      area: "Pune (Approx)",
      method: "city",
      confidence: "low"
    };
  }

  return {
    area: city || "Pune",
    method: "fallback",
    confidence: "low"
  };
}

// ------------------ CF REQUEST HANDLER -------------------
export async function onRequest({ request }) {
  const cf = request.cf || {};
  const ip = request.headers.get("cf-connecting-ip");
  const ua = request.headers.get("user-agent");

  const result = resolveAreaV5({
    postal: cf.postalCode,
    city: cf.city,
    lat: cf.latitude,
    lon: cf.longitude,
    asOrg: cf.asOrganization,
    asn: cf.asn,
    userAgent: ua
  });

  return new Response(JSON.stringify({
    ip,
    ua,
    city: cf.city,
    postal: cf.postalCode,
    region: cf.region,
    latitude: cf.latitude,
    longitude: cf.longitude,
    asOrganization: cf.asOrganization,
    asn: cf.asn,
    ...result,
    timestamp: new Date().toISOString()
  },null,2), { headers: { "Content-Type": "application/json" }});
}
