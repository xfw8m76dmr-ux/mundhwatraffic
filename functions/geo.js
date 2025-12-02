// =========================
// VERIFIED PUNE PIN → AREA MAP (CLEAN + CORRECTED)
// =========================

const areaMap = {
  // East Pune (Verified)
  "411014": "Kharadi / Wadgaon Sheri",
  "411015": "Viman Nagar / Tingre Nagar",
  "411028": "Hadapsar / Magarpatta / Amanora",
  "411036": "Mundhwa / Ghorpadi / Keshav Nagar",
  "411006": "Yerwada / Kalyani Nagar / Koregaon Park Annexe",
  "411047": "Lohegaon / Porwal Road",
  "412207": "Wagholi",
  "412307": "Manjari",
  "412308": "Phursungi",

  // Central Pune
  "411001": "Camp / MG Road / Boat Club Road / Koregaon Park",
  "411004": "Koregaon Park",
  "411005": "Bund Garden / Boat Club Road",
  "411030": "Sadashiv Peth / Shaniwar Peth / Karve Road Junction",

  // West Pune
  "411038": "Kothrud Depot Area",
  "411029": "Kothrud / Paud Road",
  "411058": "Warje / Karve Nagar Annexe",
  "411052": "Karve Nagar",
  "411007": "Aundh",
  "411045": "Baner / Balewadi",
  "411021": "Pashan / Bavdhan",

  // Hinjewadi + PCMC (North Pune)
  "411057": "Wakad / Hinjewadi Phase 2",
  "411033": "Hinjewadi Phase 1 / Phase 3",
  "411017": "Pimpri",
  "411019": "Chinchwad",
  "411035": "Bhosari",
  "411044": "Nigdi / Pradhikaran",
  "411039": "Akurdi / Chikhali",
  "412101": "Ravet / Punawale",

  // South Pune
  "411037": "Bibwewadi / Market Yard Annexe",
  "411046": "Katraj / Ambegaon",
  "411043": "Dhankawadi / Balaji Nagar",
  "411060": "Undri / Pisoli"
};


// =========================
// ZONE LOGIC (Balanced + More Accurate)
// =========================

function resolveZone(postal) {
  const east = ["411014", "411015", "411028", "411036", "411006", "411047", "412207", "412307", "412308"];
  const west = ["411038", "411029", "411058", "411052", "411007", "411045", "411021"];
  const north = ["411057", "411033", "411017", "411019", "411035", "411044", "411039", "412101"];
  const south = ["411037", "411046", "411043", "411060"];

  if (east.includes(postal)) return "East Pune";
  if (west.includes(postal)) return "West Pune";
  if (north.includes(postal)) return "North Pune (PCMC / Hinjewadi)";
  if (south.includes(postal)) return "South Pune";

  // fallback for unknown but Pune city
  return "Pune";
}


// =========================
// AREA RESOLVER (With fallback for unknown or incorrect pins)
// =========================

function resolveArea(postal, city) {
  if (areaMap[postal]) return areaMap[postal];

  // fallback for mobile ISPs with nearby pins
  if (city === "Pune") {
    return "Pune (Approx. Area Unknown)";
  }

  return city || "Pune";
}


// =========================
// MAIN CLOUDFLARE FUNCTION
// =========================

export async function onRequest({ request }) {
  const ip = request.headers.get("cf-connecting-ip");
  const cf = request.cf || {};

  const city = cf.city || "Pune";
  const postal = cf.postalCode || "000000";
  const region = cf.region || "Maharashtra";

  const area = resolveArea(postal, city);
  const zone = resolveZone(postal);

  return new Response(
    JSON.stringify({ ip, city, postal, region, area, zone }),
    { headers: { "Content-Type": "application/json" } }
  );
}
