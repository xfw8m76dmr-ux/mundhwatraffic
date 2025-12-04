export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    // Log it so you can see in Cloudflare dashboard (Tail, Logs)
    console.log("CLIENT ERROR:", JSON.stringify(data));

    // Return success
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    console.log("CLIENT ERROR PARSE FAILED:", err.message);

    return new Response(JSON.stringify({ status: "error" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
}
