const NONCE_BYTES = 32;

function generateNonce(): string {
  const bytes = new Uint8Array(NONCE_BYTES);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function injectNonce(html: string, nonce: string): string {
  html = html.replace(/<script(\s|>)/gi, `<script nonce="${nonce}"$1`);
  html = html.replace(/<style(\s|>)/gi, `<style nonce="${nonce}"$1`);
  return html;
}

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const onRequest: PagesFunction = async (context) => {
  try {
    const nonce = generateNonce();

    const csp = [
      `default-src 'self'`,
      `script-src 'strict-dynamic' 'nonce-${nonce}'`,
      `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'`,
      `img-src 'self' data:`,
      `font-src 'self'`,
      `connect-src 'self'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `object-src 'none'`,
    ].join("; ");

    const response = await context.next();
    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const injected = injectNonce(html, nonce);

      const headers = new Headers(response.headers);
      headers.set("Content-Security-Policy", csp);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        headers.set(key, value);
      }
      headers.delete("Content-Length");

      return new Response(injected, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }

    return response;
  } catch (err) {
    console.error("Middleware caught unhandled error:", err instanceof Error ? err.message : String(err), err);
    return new Response(
      JSON.stringify({ error: { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};