"use strict";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
]);

function normalizeOrigin(value) {
  return value ? value.replace(/\/+$/, "") : "";
}

function normalizeProxyPath(rawPath) {
  if (!rawPath) return "";

  return rawPath
    .replace(/^\/\.netlify\/functions\/api-proxy\/?/, "")
    .replace(/^\/?api\/?/, "")
    .replace(/^\/+/, "");
}

function buildTargetUrl(path, rawQuery) {
  const targetOrigin = normalizeOrigin(process.env.API_PROXY_TARGET);

  if (!targetOrigin) {
    throw new Error("Missing API_PROXY_TARGET environment variable.");
  }

  const query = rawQuery ? `?${rawQuery}` : "";
  return `${targetOrigin}/api/${path}${query}`;
}

exports.handler = async (event) => {
  try {
    const proxyPath = normalizeProxyPath(
      event.pathParameters?.splat || event.path || "",
    );
    const targetUrl = buildTargetUrl(proxyPath, event.rawQuery || "");

    const headers = new Headers();
    for (const [key, value] of Object.entries(event.headers || {})) {
      if (!value) continue;
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
      headers.set(key, value);
    }

    // Bypass ngrok free-tier browser interstitial for API proxy requests.
    headers.set("ngrok-skip-browser-warning", "true");

    const upstreamResponse = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: ["GET", "HEAD"].includes(event.httpMethod) ? undefined : event.body,
    });

    const responseHeaders = {};
    upstreamResponse.headers.forEach((value, key) => {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
      responseHeaders[key] = value;
    });

    return {
      statusCode: upstreamResponse.status,
      headers: responseHeaders,
      body: await upstreamResponse.text(),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "API proxy failed.",
      }),
    };
  }
};
