import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { supabaseLogger } from '@/lib/logger';
import type {
  UserProfile,
  UserProgress,
  Pet,
  DBFocusSession,
} from '@/types/supabase-models';
import {
  createDefaultProfile,
  createDefaultProgress,
  createDefaultPet,
} from '@/types/supabase-models';

// Re-export types for consumers (keep FocusSession name for backwards compatibility)
export type { UserProfile, UserProgress, Pet };
export type FocusSession = DBFocusSession;

// localStorage keys for guest mode
const STORAGE_KEYS = {
  profile: 'pet_paradise_profile',
  progress: 'pet_paradise_progress',
  pets: 'pet_paradise_pets',
  focusSessions: 'pet_paradise_focus_sessions'
};

// Schema validators for localStorage data
const validators = {
  profile: (data: unknown): data is UserProfile => {
    if (!data || typeof data !== 'object') return false;
    const profile = data as Record<string, unknown>;
    return typeof profile.user_id === 'string' &&
           typeof profile.id === 'string';
  },
  progress: (data: unknown): data is UserProgress => {
    if (!data || typeof data !== 'object') return false;
    const progress = data as Record<string, unknown>;
    return typeof progress.user_id === 'string' &&
           typeof progress.total_xp === 'number' &&
           typeof progress.current_level === 'number';
  },
  pets: (data: unknown): data is Pet[] => {
    if (!Array.isArray(data)) return false;
    return data.every(pet =>
      pet && typeof pet === 'object' &&
      typeof pet.user_id === 'string' &&
      typeof pet.pet_type === 'string'
    );
  },
  focusSessions: (data: unknown): data is FocusSession[] => {
    if (!Array.isArray(data)) return false;
    return data.every(session =>
      session && typeof session === 'object' &&
      typeof session.user_id === 'string' &&
      typeof session.duration_minutes === 'number'
    );
  }
};

// ============================================================================
// Module-level data cache — deduplicates Supabase queries across instances
// ============================================================================
// Multiple hooks call useSupabaseData() (~5 instances on startup). Without
// deduplication each fires 3 parallel Supabase queries (profiles, user_progress,
// pets) → 15 redundant queries. This cache ensures only ONE set of queries runs.

interface CachedData {
  profile: UserProfile | null;
  progress: UserProgress | null;
  pets: Pet[];
}

let _cachedUserId: string | null = null;
let _cachedData: CachedData | null = null;
let _fetchPromise: Promise<CachedData | null> | null = null;

// Event bus for cross-instance data sync
const DATA_UPDATE_EVENT = 'supabase-data-update';

function _broadcastDataUpdate(data: CachedData): void {
  _cachedData = data;
  window.dispatchEvent(new CustomEvent(DATA_UPDATE_EVENT, { detail: data }));
}

function _invalidateCache(): void {
  _cachedData = null;
  _cachedUserId = null;
  _fetchPromise = null;
}

// Shared fetch — returns cached data or runs a single set of queries
async function _fetchSharedData(userId: string): Promise<CachedData | null> {
  // Already have fresh data for this user → skip
  if (_cachedData && _cachedUserId === userId) {
    return _cachedData;
  }

  // Another instance is already fetching for this user → wait for it
  if (_fetchPromise && _cachedUserId === userId) {
    return _fetchPromise;
  }

  _cachedUserId = userId;

  _fetchPromise = (async () => {
    try {
      const [profileResult, progressResult, petsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_progress').select('*').eq('user_id', userId).single(),
        supabase.from('pets').select('*').eq('user_id', userId),
      ]);

      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        throw profileResult.error;
      }
      if (progressResult.error && progressResult.error.code !== 'PGRST116') {
        throw progressResult.error;
      }
      if (petsResult.error) {
        throw petsResult.error;
      }

      const profile = profileResult.data || createDefaultProfile(userId);
      const progressData = progressResult.data;
      const progress = progressData
        ? {
            ...progressData,
            coins: progressData.coins ?? 0,
            total_coins_earned: progressData.total_coins_earned ?? 0,
            total_coins_spent: progressData.total_coins_spent ?? 0,
          }
        : createDefaultProgress(userId);
      const pets =
        petsResult.data && petsResult.data.length > 0
          ? petsResult.data
          : [createDefaultPet(userId)];

      const data: CachedData = { profile, progress, pets };
      // Only cache if the user hasn't changed while we were fetching
      // (prevents stale data from a previous user overwriting the cache)
      if (_cachedUserId === userId) {
        _cachedData = data;
      }
      return data;
    } catch (error) {
      supabaseLogger.error('Error loading user data from Supabase:', error);
      return null;
    } finally {
      if (_cachedUserId === userId) {
        _fetchPromise = null;
      }
    }
  })();

  return _fetchPromise;
}

// ============================================================================
// Hook
// ============================================================================

export const useSupabaseData = () => {
  const { user, isAuthenticated, isGuestMode } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  // Start as loading when authenticated — prevents rendering empty state
  // on the first frame before the useEffect kicks off the data fetch.
  const [isLoading, setIsLoading] = useState(isAuthenticated && !isGuestMode);

  // Listen for cross-instance data updates
  useEffect(() => {
    const handleDataUpdate = (event: Event) => {
      const data = (event as CustomEvent<CachedData>).detail;
      if (data) {
        setProfile(data.profile);
        setProgress(data.progress);
        setPets(data.pets);
      }
    };

    window.addEventListener(DATA_UPDATE_EVENT, handleDataUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleDataUpdate);
  }, []);

  // Save data to localStorage (for guest mode)
  const saveToLocalStorage = useCallback((key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      supabaseLogger.error('Error saving to localStorage:', error);
    }
  }, []);

  // Load data from localStorage (for guest mode) with schema validation
  const loadFromLocalStorage = useCallback(<T>(key: string, validatorKey?: keyof typeof validators): T | null => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Validate against schema if validator is provided
      if (validatorKey && validators[validatorKey]) {
        if (!validators[validatorKey](parsed)) {
          supabaseLogger.warn(`Invalid data schema in localStorage for key: ${key}, clearing corrupted data`);
          localStorage.removeItem(key);
          return null;
        }
      }

      return parsed;
    } catch (error) {
      supabaseLogger.error('Error loading from localStorage:', error);
      // Clear corrupted data to prevent repeated parse errors
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore removal errors
      }
      return null;
    }
  }, []);

  // Load user data for guest mode (localStorage)
  const loadGuestData = useCallback(() => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load or create profile (with schema validation)
      let savedProfile = loadFromLocalStorage<UserProfile>(STORAGE_KEYS.profile, 'profile');
      if (!savedProfile || savedProfile.user_id !== user.id) {
        savedProfile = createDefaultProfile(user.id);
        saveToLocalStorage(STORAGE_KEYS.profile, savedProfile);
      }

      // Load or create progress (with schema validation)
      let savedProgress = loadFromLocalStorage<UserProgress>(STORAGE_KEYS.progress, 'progress');
      if (!savedProgress || savedProgress.user_id !== user.id) {
        savedProgress = createDefaultProgress(user.id);
        saveToLocalStorage(STORAGE_KEYS.progress, savedProgress);
      }

      // Load or create pets (with schema validation)
      let savedPets = loadFromLocalStorage<Pet[]>(STORAGE_KEYS.pets, 'pets');
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

  // Load user data from Supabase using the shared/deduplicated fetch
  const loadSupabaseData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const result = await _fetchSharedData(user.id);

    if (result) {
      setProfile(result.profile);
      setProgress(result.progress);
      setPets(result.pets);
      setIsLoading(false);
    } else {
      // Shared fetch failed — fall back to localStorage
      loadGuestData();
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
      _invalidateCache();
    }
  }, [isAuthenticated, user, loadUserData]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };

    if (isGuestMode) {
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
      // Update shared cache so other instances pick it up
      if (_cachedData) {
        _broadcastDataUpdate({ ..._cachedData, profile: data });
      }
      toast.success('Profile updated');
    } catch (error: unknown) {
      supabaseLogger.error('Error updating profile:', error);
      setProfile(updatedProfile);
      saveToLocalStorage(STORAGE_KEYS.profile, updatedProfile);
      if (_cachedData) {
        _broadcastDataUpdate({ ..._cachedData, profile: updatedProfile });
      }
      toast.success('Profile updated locally');
    }
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!user || !progress) return;

    const updatedProgress = { ...progress, ...updates, updated_at: new Date().toISOString() };

    if (isGuestMode) {
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

      const normalizedData = {
        ...data,
        coins: data.coins ?? 0,
        total_coins_earned: data.total_coins_earned ?? 0,
        total_coins_spent: data.total_coins_spent ?? 0,
      };
      setProgress(normalizedData);
      if (_cachedData) {
        _broadcastDataUpdate({ ..._cachedData, progress: normalizedData });
      }
    } catch (error: unknown) {
      supabaseLogger.error('Error updating progress:', error);
      setProgress(updatedProgress);
      saveToLocalStorage(STORAGE_KEYS.progress, updatedProgress);
      if (_cachedData) {
        _broadcastDataUpdate({ ..._cachedData, progress: updatedProgress });
      }
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
      const savedSessions = loadFromLocalStorage<FocusSession[]>(STORAGE_KEYS.focusSessions, 'focusSessions') || [];
      savedSessions.push(newSession);
      saveToLocalStorage(STORAGE_KEYS.focusSessions, savedSessions);

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

      if (progress) {
        await updateProgress({
          total_xp: progress.total_xp + xpEarned,
          total_sessions: progress.total_sessions + 1,
          last_session_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error: unknown) {
      supabaseLogger.error('Error adding focus session:', error);
      const savedSessions = loadFromLocalStorage<FocusSession[]>(STORAGE_KEYS.focusSessions, 'focusSessions') || [];
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

      const updatedPets = [...pets, data];
      setPets(updatedPets);
      if (_cachedData) {
        _broadcastDataUpdate({ ..._cachedData, pets: updatedPets });
      }
      toast.success(`${name} joined your island!`);
    } catch (error: unknown) {
      supabaseLogger.error('Error adding pet:', error);
      const updatedPets = [...pets, newPet];
      setPets(updatedPets);
      saveToLocalStorage(STORAGE_KEYS.pets, updatedPets);
      toast.success(`${name} joined your island!`);
    }
  };

  const updatePet = async (petId: string, updates: Partial<Pet>) => {
    if (!user) return;

    if (isGuestMode) {
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

      const updatedPets = pets.map(pet => pet.id === petId ? data : pet);
      setPets(updatedPets);
      if (_cachedData) {
        _broadcastDataUpdate({ ..._cachedData, pets: updatedPets });
      }
    } catch (error: unknown) {
      supabaseLogger.error('Error updating pet:', error);
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
