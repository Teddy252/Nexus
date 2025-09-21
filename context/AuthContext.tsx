import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthChangeEvent, Session, User, GoTrueAdminApi } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    signInWithEmail: typeof supabase.auth.signInWithPassword;
    signUpWithEmail: typeof supabase.auth.signUp;
    signInWithGoogle: () => ReturnType<typeof supabase.auth.signInWithOAuth>;
    logout: () => ReturnType<typeof supabase.auth.signOut>;
    updateUserProfile: (updates: { first_name?: string; last_name?: string }) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    updateUserPassword: (password: string) => Promise<{ error: Error | null }>;
    updateUserEmail: (email: string) => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async (user: User) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching profile:", error);
            return null;
        }
        return data as UserProfile | null;
    }, []);

     const updateUserProfile = async (updates: Partial<UserProfile>) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar perfil:", error);
            throw error;
        }
        
        setUserProfile(data as UserProfile);
    };
    
    const uploadAvatar = async (file: File) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");

        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        if (!data.publicUrl) {
            throw new Error("Não foi possível obter a URL pública do avatar.");
        }

        await updateUserProfile({ avatar_url: data.publicUrl });
    };


    useEffect(() => {
        const getSessionAndProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
                const profile = await fetchUserProfile(session.user);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        };
        
        getSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                const user = session?.user ?? null;
                setCurrentUser(user);

                if (event === 'SIGNED_IN' && user) {
                    const profile = await fetchUserProfile(user);
                    setUserProfile(profile);
                } else if (event === 'SIGNED_OUT') {
                    setUserProfile(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [fetchUserProfile]);

    const value = {
        currentUser,
        userProfile,
        updateUserProfile,
        uploadAvatar,
        signInWithEmail: (credentials) => supabase.auth.signInWithPassword(credentials),
        signUpWithEmail: (credentials) => supabase.auth.signUp(credentials),
        signInWithGoogle: () => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        }),
        logout: () => supabase.auth.signOut(),
        updateUserPassword: (password: string) => supabase.auth.updateUser({ password }),
        updateUserEmail: (email: string) => supabase.auth.updateUser({ email }),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};