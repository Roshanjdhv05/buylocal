// Supabase Edge Function: send-push
// Deploy using: supabase functions deploy send-push

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import webpush from "https://esm.sh/web-push@3.6.0"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

serve(async (req) => {
    try {
        const { user_id, title, body, url } = await req.json();

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Fetch all subscriptions for this user
        const { data: subscriptions, error } = await supabaseAdmin
            .from("push_subscriptions")
            .select("subscription")
            .eq("user_id", user_id);

        if (error) throw error;

        const notifications = subscriptions.map((sub: any) => {
            return webpush.sendNotification(
                sub.subscription,
                JSON.stringify({ title, body, url })
            ).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired or no longer valid, delete it
                    return supabaseAdmin
                        .from("push_subscriptions")
                        .delete()
                        .match({ subscription: sub.subscription });
                }
                console.error("Push error:", err);
            });
        });

        await Promise.all(notifications);

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
