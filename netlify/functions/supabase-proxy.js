export const handler = async (event, context) => {
    const SUPABASE_URL = "https://ohnumyohkpwlkcogwotj.supabase.co";
    // We get the proxy URL from the request host to be flexible
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const PROXY_URL = `${protocol}://${event.headers.host}/api/supabase`;

    // Extract the path after /api/supabase/
    const path = event.path.replace(/^\/api\/supabase/, "");
    const targetUrl = new URL(path, SUPABASE_URL);
    
    // Add query parameters
    if (event.queryStringParameters) {
        Object.keys(event.queryStringParameters).forEach(key => {
            targetUrl.searchParams.append(key, event.queryStringParameters[key]);
        });
    }

    console.log(`Proxy: Forwarding ${event.httpMethod} ${event.path} -> ${targetUrl.href}`);

    // Prepare headers for Supabase
    const headers = new Headers();
    Object.keys(event.headers).forEach(key => {
        if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
            headers.set(key, event.headers[key]);
        }
    });
    
    headers.set("X-Forwarded-Host", event.headers.host || '');
    headers.set("X-Forwarded-Proto", protocol);

    try {
        const response = await fetch(targetUrl.href, {
            method: event.httpMethod,
            headers: headers,
            body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body,
            redirect: 'manual'
        });

        const responseHeaders = {};
        
        // Rewrite Location header for redirects
        if ([301, 302, 307, 308].includes(response.status)) {
            let location = response.headers.get('location');
            if (location) {
                if (location.includes(SUPABASE_URL)) {
                    location = location.replace(SUPABASE_URL, PROXY_URL);
                }
                
                // Rewrite redirect_uri in OAuth flows
                if (location.includes("redirect_uri=")) {
                    const supOrigin = new URL(SUPABASE_URL).origin;
                    const proxOrigin = new URL(PROXY_URL).origin;
                    location = location.replace(new RegExp(encodeURIComponent(supOrigin), 'g'), encodeURIComponent(proxOrigin));
                    location = location.replace(new RegExp(supOrigin, 'g'), proxOrigin);
                }
                responseHeaders['Location'] = location;
            }
        }

        // Standard CORS
        responseHeaders['Access-Control-Allow-Origin'] = event.headers.origin || '*';
        responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
        responseHeaders['Access-Control-Allow-Headers'] = '*';
        responseHeaders['Access-Control-Allow-Credentials'] = 'true';

        // Robust Cookie Rewriting - handle multiple Set-Cookie
        // Use Headers.getSetCookie() which is available in Node 18+
        const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
        if (setCookies.length > 0) {
            const supHost = new URL(SUPABASE_URL).host;
            const proxHost = event.headers.host;
            responseHeaders['Set-Cookie'] = setCookies.map(cookie => {
                return cookie.replace(new RegExp(supHost, 'g'), proxHost);
            });
        }

        // Copy other headers
        for (const [key, value] of response.headers.entries()) {
            if (!['content-encoding', 'transfer-encoding', 'set-cookie', 'location'].includes(key.toLowerCase())) {
                responseHeaders[key] = value;
            }
        }

        const body = await response.text();

        return {
            statusCode: response.status,
            multiValueHeaders: responseHeaders,
            body: body
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Proxy implementation error', details: error.message })
        };
    }
};
