export const onRequest: PagesFunction = async (context) => {
  try {
    const response = await context.next();

    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'"
    );
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    return response;
  } catch (err) {
    console.error("Middleware caught unhandled error:", err instanceof Error ? err.message : String(err), err);
    return new Response(
      JSON.stringify({ error: { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};