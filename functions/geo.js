// /functions/geo.js

const areaMap = {
  "411014": "Kharadi",
  "411036": "Amanora / Hadapsar Annexe",
  "411040": "Magarpatta",
  "411028": "Hadapsar",
  "411027": "Mundhwa",
  "411013": "Viman Nagar",
  "411006": "Yerwada",
  "412207": "Wagholi",
  "412216": "Lohegaon",
  "411047": "Keshav Nagar",
  "411001": "Camp",
  "411004": "Koregaon Park",
  "411005": "Bund Garden",
  "411030": "Kalyani Nagar",
  "411016": "Aundh",
  "411053": "Baner",
  "411045": "Balewadi",
  "411061": "Pashan",
  "411057": "Wakad",
  "411033": "Hinjewadi",
  "411018": "Nigdi",
  "411044": "Ravet",
  "411017": "Pimpri",
  "411019": "Chinchwad",
  "411035": "Bhosari",
  "411062": "Dighi",
  "411039": "Akurdi",
  "411009": "Swargate",
  "411037": "Dhankawadi",
  "411043": "Katraj",
  "411041": "Bibwewadi",
  "411042": "Marketyard",
  "411046": "Sahakar Nagar",
  "411029": "Kothrud",
  "411058": "Warje",
  "411038": "Karve Nagar",
  "412105": "Undri",
  "412308": "Pisoli",
  "412202": "Manjari",
  "412201": "Phursungi"
};

function resolveArea(postal, city) {
  return areaMap[postal] || city || "Pune";
}

export async function onRequest({ request }) {
  const ip = request.headers.get("cf-connecting-ip");
  const cf = request.cf || {};

  const city = cf.city || "Pune";
  const postal = cf.postalCode || "000000";
  const region = cf.region || "Maharashtra";
  const area = resolveArea(postal, city);

  return new Response(
    JSON.stringify({ ip, city, postal, region, area }),
    { headers: { "Content-Type": "application/json" } }
  );
}
