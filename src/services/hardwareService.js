import { supabase } from './supabaseClient';

export const hardwareService = {
  // Fetch the full hardware catalog once so dropdown menus are instant & filter across brand + model
  async getAllComponents() {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .order('universal_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getComponentById(componentId) {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .eq('id', componentId)
      .single();

    if (error) throw error;
    return data;
  },

  async getScoredLaptops() {
    const { data, error } = await supabase
      .from('laptops_with_scores')
      .select('*')
      .order('leaderboard_laptop_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async evaluateBuildInBackend({ cpuId, gpuId, ramId, storageId }) {
    const { data, error } = await supabase.rpc('evaluate_build_backend', {
      p_cpu_id: cpuId,
      p_gpu_id: gpuId,
      p_ram_id: ramId,
      p_storage_id: storageId,
    });

    if (error) throw error;
    return data;
  },

  async getSoftwareTitles() {
    const { data, error } = await supabase
      .from('software_titles')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserSavedRigs(userId) {
    const { data, error } = await supabase
      .from('saved_rigs')
      .select(`
        *,
        cpu:components!saved_rigs_cpu_id_fkey(*),
        gpu:components!saved_rigs_gpu_id_fkey(*),
        ram:components!saved_rigs_ram_id_fkey(*),
        storage:components!saved_rigs_storage_id_fkey(*),
        laptop:laptops(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async saveUserRig(payload) {
    const { data, error } = await supabase
      .from('saved_rigs')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserRig(rigId, payload) {
    const { data, error } = await supabase
      .from('saved_rigs')
      .update(payload)
      .eq('id', rigId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUserRig(rigId) {
    const { error } = await supabase
      .from('saved_rigs')
      .delete()
      .eq('id', rigId);

    if (error) throw error;
  },
  async getPublicProfileByHandle(handle) {
    const cleanHandle = (handle || '').toLowerCase().trim();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, is_public, created_at')
      .eq('handle', cleanHandle)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    const { data: rigs, error: rigsError } = await supabase
      .from('saved_rigs')
      .select(`
        *,
        cpu:components!saved_rigs_cpu_id_fkey(id, brand, model, universal_score),
        gpu:components!saved_rigs_gpu_id_fkey(id, brand, model, universal_score, vram_gb),
        ram:components!saved_rigs_ram_id_fkey(id, brand, model, universal_score),
        storage:components!saved_rigs_storage_id_fkey(id, brand, model, universal_score)
      `)
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (rigsError) throw rigsError;
    return { profile, rigs: rigs || [] };
  },
};