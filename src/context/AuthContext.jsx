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
                    if (session?.user) {
                        console.log('Auth: Initial session found for:', session.user.email);
                        setUser(session.user);
                        await fetchProfile(session.user.id);
                    } else {
                        console.log('Auth: No initial session.');
                        setUser(null);
                        setProfile(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error.message);
            } finally {
                if (mounted) {
                    setLoading(false);
                    console.log('Auth: Initial loading finished.');
                }
            }
        };

        getInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('Auth Event Triggered:', event);
            const currentUser = session?.user ?? null;

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && session)) {
                setUser(currentUser);
                if (currentUser) {
                    console.log('Auth: Fetching/Updating profile for:', currentUser.email);
                    await handleProfileSync(currentUser);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('Auth: User signed out, clearing state.');
                setUser(null);
                setProfile(null);
            }

            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleProfileSync = async (currentUser) => {
        try {
            const { data: existingProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                console.log('Auth: Profile missing, creating default...');
                const { data: newProfile, error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: currentUser.id,
                        email: currentUser.email,
                        username: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
                        role: 'buyer'
                    }])
                    .select()
                    .single();

                if (!insertError) setProfile(newProfile);
            } else if (!profileError) {
                setProfile(existingProfile);
                console.log('Auth: Profile synced successfully.');
            }
        } catch (err) {
            console.error('Auth: Profile sync error:', err.message);
        }
    };

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
        try {
            console.log('Auth: Initiating sign out...');
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Auth: Sign out error, forcing local clear:', error.message);
        } finally {
            // Force clear state in case listener doesn't fire or fails
            setUser(null);
            setProfile(null);
            localStorage.removeItem('supabase.auth.token'); // Fallback for some older versions
            console.log('Auth: State cleared.');
        }
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

    const updateProfile = async (updates) => {
        if (!user) return;
        try {
            const { error } = await withTimeout(supabase
                .from('users')
                .update(updates)
                .eq('id', user.id));

            if (error) throw error;
            await fetchProfile(user.id);
            return true;
        } catch (error) {
            console.error('Error updating profile:', error.message);
            throw error;
        }
    };

    const upgradeToSeller = async () => {
        return updateProfile({ role: 'seller' });
    };

    return (
        <AuthContext.Provider value={{
            user, profile, signUp, signIn, signInWithGoogle, signOut, upgradeToSeller,
            updateProfile, sendPasswordResetEmail, updatePassword, loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
