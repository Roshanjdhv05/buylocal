const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
    const SUPABASE_URL = "https://ohnumyohkpwlkcogwotj.supabase.co";
    // We get the proxy URL from the request host to be flexible
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const PROXY_URL = `${protocol}://${event.headers.host}/api/supabase`;

    // Extract the path after /api/supabase/
    // Example: /api/supabase/auth/v1/authorize -> /auth/v1/authorize
    const path = event.path.replace(/^\/api\/supabase/, "");
    const targetUrl = new URL(path, SUPABASE_URL);
    
    // Add query parameters
    Object.keys(event.queryStringParameters).forEach(key => {
        targetUrl.searchParams.append(key, event.queryStringParameters[key]);
    });

    console.log(`Proxy: Forwarding ${event.httpMethod} ${event.path} -> ${targetUrl.href}`);

    // Prepare headers for Supabase
    const headers = new Headers();
    Object.keys(event.headers).forEach(key => {
        // Skip host and other sensitive headers that Supabase should see as its own or handle differently
        if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
            headers.set(key, event.headers[key]);
        }
    });
    
    // Set explicit headers for proxy identification
    headers.set("X-Forwarded-Host", event.headers.host);
    headers.set("X-Forwarded-Proto", protocol);

    try {
        const response = await fetch(targetUrl.href, {
            method: event.httpMethod,
            headers: headers,
            body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body,
            redirect: 'manual'
        });

        const responseHeaders = {};
        
        // Use Headers object to handle multiple headers of same name (like Set-Cookie)
        const fetchHeaders = response.headers;
        
        // Rewrite Location header for redirects
        if ([301, 302, 307, 308].includes(response.status)) {
            let location = fetchHeaders.get('location');
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

        // Robust Cookie Rewriting
        // In Node-fetch (Netlify Functions), we use raw() for multiple headers
        const setCookies = fetchHeaders.raw()['set-cookie'];
        if (setCookies && setCookies.length > 0) {
            const supHost = new URL(SUPABASE_URL).host;
            const proxHost = event.headers.host;
            responseHeaders['Set-Cookie'] = setCookies.map(cookie => {
                return cookie.replace(new RegExp(supHost, 'g'), proxHost);
            });
        }

        // Copy other headers
        for (const [key, value] of fetchHeaders.entries()) {
            if (!['content-encoding', 'transfer-encoding', 'set-cookie', 'location'].includes(key.toLowerCase())) {
                responseHeaders[key] = value;
            }
        }

        return {
            statusCode: response.status,
            multiValueHeaders: responseHeaders, // Important for multiple Set-Cookie
            body: await response.text()
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Proxy implementation error', details: error.message })
        };
    }
};
