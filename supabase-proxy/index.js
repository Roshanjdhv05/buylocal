export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const SUPABASE_URL = new URL(env.SUPABASE_URL).origin;
        const PROXY_URL = url.origin;

        console.log(`Proxy Request: ${request.method} ${url.pathname}${url.search}`);

        if (!env.SUPABASE_URL) {
            return new Response("SUPABASE_URL environment variable is not set", { status: 500 });
        }

        const origin = request.headers.get("Origin") || "*";

        // Explicitly handle CORS preflight (OPTIONS)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        // Rewrite the URL to point to Supabase
        const targetUrl = new URL(url.pathname + url.search, SUPABASE_URL);

        // Prepare headers for forwarding
        const newHeaders = new Headers(request.headers);
        newHeaders.delete("Host"); 
        
        // Add forwarding headers to help Supabase handle the proxying
        newHeaders.set("X-Forwarded-Host", url.host);
        newHeaders.set("X-Forwarded-Proto", url.protocol.replace(':', ''));
        
        // Ensure Cookies are forwarded for Auth
        const cookie = request.headers.get("Cookie");
        if (cookie) {
            console.log(`Proxy (${url.pathname}): Forwarding cookies`);
            newHeaders.set("Cookie", cookie);
        }

        const modifiedRequest = new Request(targetUrl, {
            method: request.method,
            headers: newHeaders,
            body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
            redirect: "manual",
        });

        console.log(`Proxy: Forwarding ${request.method} to ${targetUrl.href}`);

        try {
            const response = await fetch(modifiedRequest);
            let responseHeaders = new Headers(response.headers);
            
            console.log(`Proxy: Supabase responded with ${response.status} for ${url.pathname}`);

            // Handle Redirects
            if ([301, 302, 307, 308].includes(response.status)) {
                let location = responseHeaders.get("Location");
                if (location) {
                    console.log(`Proxy Redirect: Original Location = ${location}`);
                    
                    // Rewrite Supabase URL to Proxy URL
                    if (location.includes(SUPABASE_URL)) {
                        location = location.replace(SUPABASE_URL, PROXY_URL);
                    }
                    
                    // Rewrite redirect_uri in OAuth flows
                    if (location.includes("redirect_uri=")) {
                        const supUrlObj = new URL(SUPABASE_URL);
                        const proxUrlObj = new URL(PROXY_URL);
                        
                        // Handle both encoded and unencoded versions
                        location = location.replace(new RegExp(encodeURIComponent(supUrlObj.origin), 'g'), encodeURIComponent(proxUrlObj.origin));
                        location = location.replace(new RegExp(supUrlObj.origin, 'g'), proxUrlObj.origin);
                    }
                    
                    console.log(`Proxy Redirect: Rewritten Location = ${location}`);
                    responseHeaders.set("Location", location);
                }
            }

            // CORS headers - avoid using wildcard if origin is present
            responseHeaders.set("Access-Control-Allow-Origin", origin);
            responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            responseHeaders.set("Access-Control-Allow-Headers", "*");
            responseHeaders.set("Access-Control-Allow-Credentials", "true");
            // Expose headers for Supabase client
            responseHeaders.set("Access-Control-Expose-Headers", "Content-Range, X-Supabase-Api-Version, apikey, x-client-info");

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });
        } catch (error) {
            console.error(`Proxy Error: ${error.message}`);
            return new Response(`Proxy Error: ${error.message}`, { status: 502 });
        }
    },
};
