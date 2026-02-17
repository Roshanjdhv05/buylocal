import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, withTimeout } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const getInitialSession = async () => {
            console.log('Auth: Getting initial session...');
            try {
                const { data: { session }, error } = await withTimeout(supabase.auth.getSession());
                if (error) throw error;

                if (mounted) {
                    console.log('Auth: Session obtained:', session?.user?.email || 'none');
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error.message);
            } finally {
                if (mounted) {
                    console.log('Auth: Loading finished.');
                    setLoading(false);
                }
            }
        };

        getInitialSession();

        // Failsafe: Ensure auth loading ends after 10s
        const authFailsafe = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth: Failsafe timeout reached. Forcing loading to false.');
                setLoading(false);
            }
        }, 10000);

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('Auth event:', event);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Check if profile exists, if not create it (common for first-time OAuth)
                const { data: existingProfile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError && profileError.code === 'PGRST116') {
                    // Profile missing, create default one
                    console.log('Auth: Profile missing for user, creating default...');
                    const { data: newProfile, error: insertError } = await supabase
                        .from('users')
                        .insert([{
                            id: currentUser.id,
                            email: currentUser.email,
                            username: currentUser.user_metadata.full_name || currentUser.email.split('@')[0],
                            role: 'buyer'
                        }])
                        .select()
                        .single();

                    if (!insertError) setProfile(newProfile);
                } else {
                    setProfile(existingProfile);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            clearTimeout(authFailsafe);
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await withTimeout(supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single());

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error.message);
        }
    };

    const signUp = async (email, password, metadata) => {
        const { data, error } = await withTimeout(supabase.auth.signUp({
            email,
            password,
        }));

        if (error) throw error;

        if (data.user) {
            const { error: profileError } = await withTimeout(supabase
                .from('users')
                .insert([{
                    id: data.user.id,
                    email,
                    username: metadata.username,
                    role: metadata.role,
                    city: metadata.city,
                    state: metadata.state,
                    lat: metadata.lat,
                    lng: metadata.lng
                }]));

            if (profileError) throw profileError;
        }

        return data;
    };

    const signIn = async (email, password) => {
        const { data, error } = await withTimeout(supabase.auth.signInWithPassword({
            email,
            password,
        }));
        if (error) throw error;
        return data;
    };

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const sendPasswordResetEmail = async (email) => {
        const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        }));
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await withTimeout(supabase.auth.updateUser({
            password: newPassword
        }));
        if (error) throw error;
    };

    const upgradeToSeller = async () => {
        if (!user) return;
        try {
            const { error } = await withTimeout(supabase
                .from('users')
                .update({ role: 'seller' })
                .eq('id', user.id));

            if (error) throw error;

            // Refresh local profile state
            await fetchProfile(user.id);
            return true;
        } catch (error) {
            console.error('Error upgrading to seller:', error.message);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user, profile, signUp, signIn, signInWithGoogle, signOut, upgradeToSeller,
            sendPasswordResetEmail, updatePassword, loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
