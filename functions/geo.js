export default {
  async fetch(request) {
    const ip = request.headers.get("cf-connecting-ip");
    const cf = request.cf || {};

    const areaMap = {
      "411014": "Kharadi",
      "411028": "Hadapsar",
      "411036": "Amanora",
      "411013": "Viman Nagar",
      "411021": "Baner",
      "411057": "Wakad",
      "411040": "Magarpatta",
      "411066": "Keshav Nagar",
      "411027": "Mundhwa"
    };

    const city = cf.city || "Unknown";
    const postal = cf.postalCode || "Unknown";
    const region = cf.region || "Unknown";

    const area = areaMap[postal] || city;

    return new Response(
      JSON.stringify({
        ip,
        city,
        region,
        postal,
        area
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
};
