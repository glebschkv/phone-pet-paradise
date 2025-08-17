import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  last_session_date: string | null;
  streak_freeze_count: number;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  pet_type: string;
  name: string;
  bond_level: number;
  experience: number;
  mood: number;
  unlocked_at: string;
  is_favorite: boolean;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  xp_earned: number;
  session_type: string;
  completed_at: string;
}

export const useSupabaseData = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      setProfile(null);
      setProgress(null);
      setPets([]);
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Load progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      // Load pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id);

      if (petsError) throw petsError;

      setProfile(profileData);
      setProgress(progressData);
      setPets(petsData || []);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      toast.success('Profile updated');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProgress(data);
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const addFocusSession = async (durationMinutes: number, xpEarned: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          xp_earned: xpEarned,
          session_type: 'focus'
        });

      if (error) throw error;

      // Update progress
      if (progress) {
        await updateProgress({
          total_xp: progress.total_xp + xpEarned,
          total_sessions: progress.total_sessions + 1,
          last_session_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error: any) {
      console.error('Error adding focus session:', error);
      toast.error('Failed to save session');
    }
  };

  const addPet = async (petType: string, name: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          pet_type: petType,
          name: name
        })
        .select()
        .single();

      if (error) throw error;
      
      setPets(prev => [...prev, data]);
      toast.success(`${name} joined your island!`);
    } catch (error: any) {
      console.error('Error adding pet:', error);
      toast.error('Failed to add pet');
    }
  };

  const updatePet = async (petId: string, updates: Partial<Pet>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', petId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setPets(prev => prev.map(pet => pet.id === petId ? data : pet));
    } catch (error: any) {
      console.error('Error updating pet:', error);
      toast.error('Failed to update pet');
    }
  };

  return {
    profile,
    progress,
    pets,
    isLoading,
    loadUserData,
    updateProfile,
    updateProgress,
    addFocusSession,
    addPet,
    updatePet
  };
};