import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    try {
      const data = await authService.getProfile(authUser.id);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Check for an existing session on initial page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfile(currentUser).finally(() => setLoading(false));
    });

    // 2. Subscribe to login, logout, and token refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfile(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

const value = {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    register: authService.register,
    login: authService.login,
    signInWithOAuth: authService.signInWithOAuth,
    logout: authService.logout,
    resetPassword: authService.resetPassword,
    updatePrivacy: async (isPublic) => {
      if (!user) return;
      const updated = await authService.updatePrivacy(user.id, isPublic);
      setProfile(updated);
      return updated;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}