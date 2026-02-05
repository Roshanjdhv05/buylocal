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
                await fetchProfile(currentUser.id);
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

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, profile, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
