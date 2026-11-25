import { supabase } from './supabaseClient';

export const authService = {
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

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    return data;
  },

  async signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider, // 'google' | 'github' | 'discord'
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    });

    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/login`,
    });

    if (error) throw error;
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, display_name, is_public, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

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