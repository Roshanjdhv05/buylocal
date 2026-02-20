import { supabase } from '../services/supabase';

const PUBLIC_VAPID_KEY = 'BECBLAQHV1w2uuGxVoHXnu7YPoflGSQbyUJcjvXh58g5rkIg5AmLlgERAFn7HFrLt4nvXn6nRnlfNgUk7ZBtLH8';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered with scope:', registration.scope);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

export async function subscribeToPush(userId) {
    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if we already have a subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            // Unsubscribe if needed or just update
            // await existingSubscription.unsubscribe();
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        console.log('User is subscribed:', subscription);

        // Save subscription to Supabase
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert([
                {
                    user_id: userId,
                    subscription: subscription.toJSON()
                }
            ], { onConflict: 'user_id, subscription' });

        if (error) throw error;

        localStorage.setItem('push_enabled', 'true');
        return true;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return false;
    }
}

export async function requestNotificationPermission(userId) {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications.');
        return;
    }

    if (Notification.permission === 'granted') {
        return subscribeToPush(userId);
    } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return subscribeToPush(userId);
        }
    }
}
