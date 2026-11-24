import { supabase } from './supabaseClient';

export const authService = {
  // 1. Register a new user; metadata is read by your SQL trigger to create public.profiles
  async register({ email, password, displayName, handle, isPublic = true }) {
    const cleanHandle = (handle || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        data: {
          display_name: (displayName || '').trim(),
          handle: cleanHandle,
          is_public: isPublic,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // 2. Sign in an existing user with email and password
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    return data;
  },

  // 3. Sign out and clear the browser session
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 4. Send a password reset link to the user's email
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/login`,
    });

    if (error) throw error;
  },

  // 5. Fetch the user's custom RigCheck profile row from public.profiles
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, display_name, is_public, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // 6. Update public/private profile visibility in PostgreSQL
  async updatePrivacy(userId, isPublic) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_public: isPublic })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};