import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/notion/$").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const notionPath = url.pathname.replace(/^\/notion\/?/, "");
    const notionUrl = `https://api.notion.com/${notionPath}${url.search}`;

    console.log("notionUrl", notionUrl);

    const headers = new Headers(request.headers);
    headers.delete("host");
    if (headers.has("origin")) {
      headers.set("origin", "https://api.notion.com");
    }
    // Remove Accept-Encoding to prevent double compression issues
    headers.delete("accept-encoding");

    const hasBody = !(request.method === "GET" || request.method === "HEAD");
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (hasBody) {
      fetchOptions.body = request.body;
      // Required for streaming request bodies in Node.js fetch
      // See: https://developer.mozilla.org/en-US/docs/Web/API/fetch#specifying_duplex
      // and https://github.com/nodejs/undici/blob/main/docs/api/README.md#requestinitduplex
      // Only needed if body is present and not GET/HEAD
      // @ts-ignore
      fetchOptions.duplex = "half";
    }

    const notionResponse = await fetch(notionUrl, fetchOptions);

    const responseHeaders = new Headers(notionResponse.headers);
    // Remove Content-Encoding from response to prevent decoding errors
    responseHeaders.delete("content-encoding");
    const body = notionResponse.body;

    return new Response(body, {
      status: notionResponse.status,
      statusText: notionResponse.statusText,
      headers: responseHeaders,
    });
  },
  POST: async ({ request }) => {
    const url = new URL(request.url);
    const notionPath = url.pathname.replace(/^\/notion\/?/, "");
    const notionUrl = `https://api.notion.com/${notionPath}${url.search}`;

    console.log("notionUrl", notionUrl);

    const headers = new Headers(request.headers);
    headers.delete("host");
    if (headers.has("origin")) {
      headers.set("origin", "https://api.notion.com");
    }
    // Remove Accept-Encoding to prevent double compression issues
    headers.delete("accept-encoding");

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
      // Required for streaming request bodies in Node.js fetch
      // See: https://developer.mozilla.org/en-US/docs/Web/API/fetch#specifying_duplex
      // and https://github.com/nodejs/undici/blob/main/docs/api/README.md#requestinitduplex
      // @ts-ignore
      duplex: "half",
    };

    const notionResponse = await fetch(notionUrl, fetchOptions);

    const responseHeaders = new Headers(notionResponse.headers);
    // Remove Content-Encoding from response to prevent decoding errors
    responseHeaders.delete("content-encoding");
    const body = notionResponse.body;

    return new Response(body, {
      status: notionResponse.status,
      statusText: notionResponse.statusText,
      headers: responseHeaders,
    });
  },
});
