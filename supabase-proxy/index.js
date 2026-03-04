export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const SUPABASE_URL = env.SUPABASE_URL;

        if (!SUPABASE_URL) {
            return new Response("SUPABASE_URL environment variable is not set", { status: 500 });
        }

        // Explicitly handle CORS preflight (OPTIONS)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        // Rewrite the URL to point to Supabase
        const targetUrl = new URL(url.pathname + url.search, SUPABASE_URL);

        // Clone and prepare headers
        const newHeaders = new Headers(request.headers);
        newHeaders.delete("Host"); // Let the fetch set the correct host header

        const modifiedRequest = new Request(targetUrl, {
            method: request.method,
            headers: newHeaders,
            body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
            redirect: "follow",
        });

        try {
            const response = await fetch(modifiedRequest);

            // Clone response to add CORS headers
            const responseHeaders = new Headers(response.headers);
            responseHeaders.set("Access-Control-Allow-Origin", "*");
            responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            responseHeaders.set("Access-Control-Allow-Headers", "*");

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });
        } catch (error) {
            return new Response(`Proxy Error: ${error.message}`, { status: 502 });
        }
    },
};
