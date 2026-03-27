import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ id: 'catchly', public_settings: {} });

  useEffect(() => {
    // Ersten Auth-Status laden
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Live Auth-Änderungen abonnieren (Login, Logout, Token-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session) => {
    if (session?.user) {
      // Profil aus profiles-Tabelle laden
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const fullUser = {
        id: session.user.id,
        email: session.user.email,
        full_name: profile?.full_name ?? session.user.user_metadata?.full_name ?? '',
        nickname: profile?.nickname ?? '',
        profile_picture_url: profile?.profile_picture_url ?? '',
        is_demo_user: profile?.is_demo_user ?? false,
        premium_plan_id: profile?.premium_plan_id ?? 'free',
        settings: profile?.settings ?? {},
        credits: profile?.credits ?? 0,
        total_points: profile?.total_points ?? 0,
        ...profile,
      };

      setUser(fullUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
  };

  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  };

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    // Profil anlegen
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        premium_plan_id: 'free',
        credits: 0,
        settings: {},
      });
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await handleSession(session);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      loginWithGoogle,
      register,
      logout,
      navigateToLogin,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
