export const handler = async (event, context) => {
    const SUPABASE_URL = "https://ohnumyohkpwlkcogwotj.supabase.co";
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const PROXY_URL = `${protocol}://${event.headers.host}/api/supabase`;

    const path = event.path.replace(/^\/api\/supabase/, "");
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

        // multiValueHeaders MUST contain arrays of strings for EVERY key
        const responseHeaders = {};
        const setMultiHeader = (key, value) => {
            const normalizedKey = key.toLowerCase().split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-');
            if (Array.isArray(value)) {
                responseHeaders[normalizedKey] = value;
            } else {
                responseHeaders[normalizedKey] = [value];
            }
        };
        
        // Rewrite Location header for redirects
        if ([301, 302, 307, 308].includes(response.status)) {
            let location = response.headers.get('location');
            if (location) {
                if (location.includes(SUPABASE_URL)) {
                    location = location.replace(SUPABASE_URL, PROXY_URL);
                }
                
                if (location.includes("redirect_uri=")) {
                    const supOrigin = new URL(SUPABASE_URL).origin;
                    const proxOrigin = new URL(PROXY_URL).origin;
                    location = location.replace(new RegExp(encodeURIComponent(supOrigin), 'g'), encodeURIComponent(proxOrigin));
                    location = location.replace(new RegExp(supOrigin, 'g'), proxOrigin);
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
            setMultiHeader('Set-Cookie', rewrittenCookies);
        }

        // Copy other headers
        for (const [key, value] of response.headers.entries()) {
            const lowerKey = key.toLowerCase();
            if (!['content-encoding', 'transfer-encoding', 'set-cookie', 'location', 'content-length'].includes(lowerKey)) {
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
