import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient.ts';
// Import v2 types from supabase-js
import type { User, Session, AuthChangeEvent, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, OAuthResponse } from '@supabase/supabase-js';
import { UserProfile } from '../types.ts';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    // Update method signatures for v2
    signInWithEmail: (credentials: SignInWithPasswordCredentials) => ReturnType<typeof supabase.auth.signInWithPassword>;
    signUpWithEmail: (credentials: SignUpWithPasswordCredentials) => ReturnType<typeof supabase.auth.signUp>;
    signInWithGoogle: () => Promise<OAuthResponse>;
    logout: () => ReturnType<typeof supabase.auth.signOut>;
    updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    updateUserPassword: (password: string) => ReturnType<typeof supabase.auth.updateUser>;
    updateUserEmail: (email: string) => ReturnType<typeof supabase.auth.updateUser>;
}

// Default values for createContext must match the new interface
export const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userProfile: null,
    signInWithEmail: () => Promise.resolve({} as any),
    signUpWithEmail: () => Promise.resolve({} as any),
    signInWithGoogle: () => Promise.resolve({} as any),
    logout: () => Promise.resolve({} as any),
    updateUserProfile: () => Promise.resolve(),
    uploadAvatar: () => Promise.resolve(),
    updateUserPassword: () => Promise.resolve({} as any),
    updateUserEmail: () => Promise.resolve({} as any),
});

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
        
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
            console.error("Error fetching profile:", error);
            return null;
        }
        return data as UserProfile | null;
    }, []);

    const createProfileFromOAuth = useCallback(async (user: User) => {
        const fullName = user.user_metadata?.full_name || 'Usuário';
        const avatarUrl = user.user_metadata?.avatar_url;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const { data: newProfile, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                avatar_url: avatarUrl,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating profile for OAuth user:", error);
            return null;
        }
        return newProfile as UserProfile;
    }, []);

     const updateUserProfile = async (updates: Partial<UserProfile>) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");

        const upsertData = {
            id: currentUser.id,
            ...updates,
        };

        const { data, error } = await supabase
            .from('profiles')
            .upsert(upsertData)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar/criar perfil:", error);
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
            try {
                // Use async supabase.auth.getSession() for v2
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Error getting session:", error);
                    throw error;
                }
                
                const user = session?.user ?? null;
                setCurrentUser(user);

                if (user) {
                    let profile = await fetchUserProfile(user);
                     if (!profile && user.app_metadata.provider === 'google') {
                        profile = await createProfileFromOAuth(user);
                    }
                    setUserProfile(profile);
                } else {
                    setUserProfile(null);
                }
            } catch (error) {
                 console.error("Error during initial session and profile fetch:", error);
                setCurrentUser(null);
                setUserProfile(null);
            } finally {
                setLoading(false);
            }
        };
        
        getSessionAndProfile();

        // v2 onAuthStateChange signature.
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                const user = session?.user ?? null;
                setCurrentUser(user);

                if (event === 'SIGNED_IN' && user) {
                    let profile = await fetchUserProfile(user);
                     if (!profile && user.app_metadata.provider === 'google') {
                        profile = await createProfileFromOAuth(user);
                    }
                    setUserProfile(profile);
                } else if (event === 'SIGNED_OUT') {
                    setUserProfile(null);
                }
            }
        );

        return () => {
            authListener?.unsubscribe();
        };
    }, [fetchUserProfile, createProfileFromOAuth]);

    const value = {
        currentUser,
        userProfile,
        updateUserProfile,
        uploadAvatar,
        // Use v2 methods
        signInWithEmail: (credentials: SignInWithPasswordCredentials) => supabase.auth.signInWithPassword(credentials),
        signUpWithEmail: (credentials: SignUpWithPasswordCredentials) => supabase.auth.signUp(credentials),
        signInWithGoogle: () => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
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
