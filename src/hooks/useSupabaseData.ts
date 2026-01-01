import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { supabaseLogger } from '@/lib/logger';

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

// localStorage keys for guest mode
const STORAGE_KEYS = {
  profile: 'pet_paradise_profile',
  progress: 'pet_paradise_progress',
  pets: 'pet_paradise_pets',
  focusSessions: 'pet_paradise_focus_sessions'
};

// Default data for new users/guests
const createDefaultProfile = (userId: string): UserProfile => ({
  id: `profile-${userId}`,
  user_id: userId,
  display_name: 'Pet Paradise Player',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const createDefaultProgress = (userId: string): UserProgress => ({
  id: `progress-${userId}`,
  user_id: userId,
  total_xp: 0,
  current_level: 1,
  current_streak: 0,
  longest_streak: 0,
  total_sessions: 0,
  last_session_date: null,
  streak_freeze_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const createDefaultPet = (userId: string): Pet => ({
  id: `pet-${Date.now()}`,
  user_id: userId,
  pet_type: 'panda',
  name: 'Bamboo',
  bond_level: 1,
  experience: 0,
  mood: 100,
  unlocked_at: new Date().toISOString(),
  is_favorite: true,
  created_at: new Date().toISOString()
});

export const useSupabaseData = () => {
  const { user, isAuthenticated, isGuestMode } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Save data to localStorage (for guest mode)
  const saveToLocalStorage = useCallback((key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      supabaseLogger.error('Error saving to localStorage:', error);
    }
  }, []);

  // Load data from localStorage (for guest mode)
  const loadFromLocalStorage = useCallback(<T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      supabaseLogger.error('Error loading from localStorage:', error);
      return null;
    }
  }, []);

  // Load user data for guest mode (localStorage)
  const loadGuestData = useCallback(() => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load or create profile
      let savedProfile = loadFromLocalStorage<UserProfile>(STORAGE_KEYS.profile);
      if (!savedProfile || savedProfile.user_id !== user.id) {
        savedProfile = createDefaultProfile(user.id);
        saveToLocalStorage(STORAGE_KEYS.profile, savedProfile);
      }

      // Load or create progress
      let savedProgress = loadFromLocalStorage<UserProgress>(STORAGE_KEYS.progress);
      if (!savedProgress || savedProgress.user_id !== user.id) {
        savedProgress = createDefaultProgress(user.id);
        saveToLocalStorage(STORAGE_KEYS.progress, savedProgress);
      }

      // Load or create pets
      let savedPets = loadFromLocalStorage<Pet[]>(STORAGE_KEYS.pets);
      if (!savedPets || savedPets.length === 0) {
        savedPets = [createDefaultPet(user.id)];
        saveToLocalStorage(STORAGE_KEYS.pets, savedPets);
      }

      setProfile(savedProfile);
      setProgress(savedProgress);
      setPets(savedPets);
    } catch (error) {
      supabaseLogger.error('Error loading guest data:', error);
      // Create defaults if loading fails
      const defaultProfile = createDefaultProfile(user.id);
      const defaultProgress = createDefaultProgress(user.id);
      const defaultPets = [createDefaultPet(user.id)];

      setProfile(defaultProfile);
      setProgress(defaultProgress);
      setPets(defaultPets);

      saveToLocalStorage(STORAGE_KEYS.profile, defaultProfile);
      saveToLocalStorage(STORAGE_KEYS.progress, defaultProgress);
      saveToLocalStorage(STORAGE_KEYS.pets, defaultPets);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadFromLocalStorage, saveToLocalStorage]);

  // Load user data from Supabase (for authenticated users)
  const loadSupabaseData = useCallback(async () => {
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

      // Use data from Supabase, or create defaults if not found
      setProfile(profileData || createDefaultProfile(user.id));
      setProgress(progressData || createDefaultProgress(user.id));
      setPets(petsData && petsData.length > 0 ? petsData : [createDefaultPet(user.id)]);
    } catch (error: unknown) {
      supabaseLogger.error('Error loading user data from Supabase:', error);
      // Fall back to localStorage on error
      loadGuestData();
    } finally {
      setIsLoading(false);
    }
  }, [user, loadGuestData]);

  // Main data loading function
  const loadUserData = useCallback(async () => {
    if (!user) return;

    if (isGuestMode) {
      loadGuestData();
    } else {
      await loadSupabaseData();
    }
  }, [user, isGuestMode, loadGuestData, loadSupabaseData]);

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      setProfile(null);
      setProgress(null);
      setPets([]);
    }
  }, [isAuthenticated, user, loadUserData]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };

    if (isGuestMode) {
      // Save to localStorage for guest users
      setProfile(updatedProfile);
      saveToLocalStorage(STORAGE_KEYS.profile, updatedProfile);
      toast.success('Profile updated');
      return;
    }

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
    } catch (error: unknown) {
      supabaseLogger.error('Error updating profile:', error);
      // Fall back to local update on error
      setProfile(updatedProfile);
      saveToLocalStorage(STORAGE_KEYS.profile, updatedProfile);
      toast.success('Profile updated locally');
    }
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!user || !progress) return;

    const updatedProgress = { ...progress, ...updates, updated_at: new Date().toISOString() };

    if (isGuestMode) {
      // Save to localStorage for guest users
      setProgress(updatedProgress);
      saveToLocalStorage(STORAGE_KEYS.progress, updatedProgress);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProgress(data);
    } catch (error: unknown) {
      supabaseLogger.error('Error updating progress:', error);
      // Fall back to local update on error
      setProgress(updatedProgress);
      saveToLocalStorage(STORAGE_KEYS.progress, updatedProgress);
    }
  };

  const addFocusSession = async (durationMinutes: number, xpEarned: number) => {
    if (!user) return;

    const newSession: FocusSession = {
      id: `session-${Date.now()}`,
      user_id: user.id,
      duration_minutes: durationMinutes,
      xp_earned: xpEarned,
      session_type: 'focus',
      completed_at: new Date().toISOString()
    };

    if (isGuestMode) {
      // Save to localStorage for guest users
      const savedSessions = loadFromLocalStorage<FocusSession[]>(STORAGE_KEYS.focusSessions) || [];
      savedSessions.push(newSession);
      saveToLocalStorage(STORAGE_KEYS.focusSessions, savedSessions);

      // Update progress
      if (progress) {
        await updateProgress({
          total_xp: progress.total_xp + xpEarned,
          total_sessions: progress.total_sessions + 1,
          last_session_date: new Date().toISOString().split('T')[0]
        });
      }
      return;
    }

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
    } catch (error: unknown) {
      supabaseLogger.error('Error adding focus session:', error);
      // Fall back to local storage on error
      const savedSessions = loadFromLocalStorage<FocusSession[]>(STORAGE_KEYS.focusSessions) || [];
      savedSessions.push(newSession);
      saveToLocalStorage(STORAGE_KEYS.focusSessions, savedSessions);

      if (progress) {
        const updatedProgress = {
          ...progress,
          total_xp: progress.total_xp + xpEarned,
          total_sessions: progress.total_sessions + 1,
          last_session_date: new Date().toISOString().split('T')[0]
        };
        setProgress(updatedProgress);
        saveToLocalStorage(STORAGE_KEYS.progress, updatedProgress);
      }
    }
  };

  const addPet = async (petType: string, name: string) => {
    if (!user) return;

    const newPet: Pet = {
      id: `pet-${Date.now()}`,
      user_id: user.id,
      pet_type: petType,
      name: name,
      bond_level: 1,
      experience: 0,
      mood: 100,
      unlocked_at: new Date().toISOString(),
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    if (isGuestMode) {
      // Save to localStorage for guest users
      const updatedPets = [...pets, newPet];
      setPets(updatedPets);
      saveToLocalStorage(STORAGE_KEYS.pets, updatedPets);
      toast.success(`${name} joined your island!`);
      return;
    }

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
    } catch (error: unknown) {
      supabaseLogger.error('Error adding pet:', error);
      // Fall back to local storage on error
      const updatedPets = [...pets, newPet];
      setPets(updatedPets);
      saveToLocalStorage(STORAGE_KEYS.pets, updatedPets);
      toast.success(`${name} joined your island!`);
    }
  };

  const updatePet = async (petId: string, updates: Partial<Pet>) => {
    if (!user) return;

    if (isGuestMode) {
      // Update in localStorage for guest users
      const updatedPets = pets.map(pet =>
        pet.id === petId ? { ...pet, ...updates } : pet
      );
      setPets(updatedPets);
      saveToLocalStorage(STORAGE_KEYS.pets, updatedPets);
      return;
    }

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
    } catch (error: unknown) {
      supabaseLogger.error('Error updating pet:', error);
      // Fall back to local storage on error
      const updatedPets = pets.map(pet =>
        pet.id === petId ? { ...pet, ...updates } : pet
      );
      setPets(updatedPets);
      saveToLocalStorage(STORAGE_KEYS.pets, updatedPets);
    }
  };

  return {
    profile,
    progress,
    pets,
    isLoading,
    isGuestMode,
    loadUserData,
    updateProfile,
    updateProgress,
    addFocusSession,
    addPet,
    updatePet
  };
};