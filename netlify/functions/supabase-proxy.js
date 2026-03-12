export const handler = async (event, context) => {
    const SUPABASE_URL = "https://ohnumyohkpwlkcogwotj.supabase.co";
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    
    const PROXY_PATH = "/api/supabase";
    const PROXY_URL = `${protocol}://${event.headers.host}${PROXY_PATH}`;

    const path = event.path.replace(new RegExp(`^${PROXY_PATH}`), "");
    const targetUrl = new URL(path, SUPABASE_URL);
    
    if (event.queryStringParameters) {
        Object.keys(event.queryStringParameters).forEach(key => {
            targetUrl.searchParams.append(key, event.queryStringParameters[key]);
        });
    }

    console.log(`Proxy: Forwarding ${event.httpMethod} ${event.path} -> ${targetUrl.href}`);

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
        const setMultiHeader = (key, value) => {
            const normalizedKey = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('-');
            responseHeaders[normalizedKey] = Array.isArray(value) ? value : [value];
        };
        
        // Rewrite Location header for redirects
        if ([301, 302, 307, 308].includes(response.status)) {
            let location = response.headers.get('location');
            if (location) {
                const supOrigin = new URL(SUPABASE_URL).origin;
                
                console.log(`Proxy: Original Location = ${location}`);
                
                // ONLY rewrite if the redirect is pointing back to Supabase domain
                // If it's pointing to Google (accounts.google.com), LEAVE IT ALONE.
                // This ensures the redirect_uri param remains the standard Supabase callback.
                if (location.startsWith(supOrigin)) {
                    location = location.replace(supOrigin, PROXY_URL);
                    console.log(`Proxy: Rewritten Location = ${location}`);
                } else {
                    console.log(`Proxy: Keeping external redirect = ${location}`);
                }
                
                setMultiHeader('Location', location);
            }
        }

        // Standard CORS
        setMultiHeader('Access-Control-Allow-Origin', event.headers.origin || '*');
        setMultiHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        setMultiHeader('Access-Control-Allow-Headers', '*');
        setMultiHeader('Access-Control-Allow-Credentials', 'true');

        // Robust Cookie Rewriting
        const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
        if (setCookies.length > 0) {
            const supHost = new URL(SUPABASE_URL).host;
            const proxHost = event.headers.host;
            const rewrittenCookies = setCookies.map(cookie => {
                return cookie.replace(new RegExp(supHost, 'g'), proxHost);
            });
            console.log(`Proxy: Rewriting ${rewrittenCookies.length} cookies`);
            setMultiHeader('Set-Cookie', rewrittenCookies);
        }

        for (const [key, value] of response.headers.entries()) {
            const lowerKey = key.toLowerCase();
            if (!['content-encoding', 'transfer-encoding', 'set-cookie', 'location', 'content-length', 'connection', 'keep-alive'].includes(lowerKey)) {
                setMultiHeader(key, value);
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
