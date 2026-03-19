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

    // CRITICAL: Handle binary bodies from Netlify (which are base64 encoded)
    let requestBody = event.body;
    if (event.body && event.isBase64Encoded) {
        requestBody = Buffer.from(event.body, 'base64');
    }

    try {
        const response = await fetch(targetUrl.href, {
            method: event.httpMethod,
            headers: headers,
            body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : requestBody,
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
                
                if (location.startsWith(supOrigin)) {
                    location = location.replace(supOrigin, PROXY_URL);
                    console.log(`Proxy: Rewritten Location = ${location}`);
                }
                
                setMultiHeader('Location', location);
            }
        }

        // Standard CORS
        setMultiHeader('Access-Control-Allow-Origin', event.headers.origin || '*');
        setMultiHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        setMultiHeader('Access-Control-Allow-Headers', '*');
        setMultiHeader('Access-Control-Allow-Credentials', 'true');
        setMultiHeader('Access-Control-Expose-Headers', 'Content-Range, X-Supabase-Api-Version, apikey, x-client-info');

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

        for (const [key, value] of response.headers.entries()) {
            const lowerKey = key.toLowerCase();
            if (!['content-encoding', 'transfer-encoding', 'set-cookie', 'location', 'content-length', 'connection', 'keep-alive'].includes(lowerKey)) {
                setMultiHeader(key, value);
            }
        }

        // Handle binary responses (e.g. image downloads)
        const contentType = response.headers.get('content-type') || '';
        const isBinary = contentType.includes('image/') || contentType.includes('video/') || contentType.includes('audio/') || contentType.includes('application/octet-stream') || contentType.includes('pdf');

        if (isBinary) {
            const buffer = await response.arrayBuffer();
            return {
                statusCode: response.status,
                multiValueHeaders: responseHeaders,
                body: Buffer.from(buffer).toString('base64'),
                isBase64Encoded: true
            };
        } else {
            const body = await response.text();
            return {
                statusCode: response.status,
                multiValueHeaders: responseHeaders,
                body: body,
                isBase64Encoded: false
            };
        }
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Proxy implementation error', details: error.message })
        };
    }

};
