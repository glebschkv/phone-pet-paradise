import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSupabaseData, UserProfile, UserProgress, Pet, FocusSession } from '@/hooks/useSupabaseData';

// Type for mocked auth state
interface MockAuthState {
  user: { id: string } | null;
  isAuthenticated: boolean;
  isGuestMode: boolean;
}

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true,
    isGuestMode: true,
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  supabaseLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  select: mockSupabaseSelect,
  update: mockSupabaseUpdate,
  insert: mockSupabaseInsert,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

describe('useSupabaseData', () => {
  const STORAGE_KEYS = {
    profile: 'pet_paradise_profile',
    progress: 'pet_paradise_progress',
    pets: 'pet_paradise_pets',
    focusSessions: 'pet_paradise_focus_sessions',
  };

  const mockUser = { id: 'test-user-id' };

  const mockProfile: UserProfile = {
    id: 'profile-test-user-id',
    user_id: 'test-user-id',
    display_name: 'Test User',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockProgress: UserProgress = {
    id: 'progress-test-user-id',
    user_id: 'test-user-id',
    total_xp: 500,
    current_level: 5,
    current_streak: 3,
    longest_streak: 10,
    total_sessions: 25,
    last_session_date: '2024-01-01',
    streak_freeze_count: 2,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockPet: Pet = {
    id: 'pet-123',
    user_id: 'test-user-id',
    pet_type: 'cat',
    name: 'Whiskers',
    bond_level: 3,
    experience: 150,
    mood: 80,
    unlocked_at: '2024-01-01T00:00:00.000Z',
    is_favorite: true,
    created_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset the mocks
    mockSupabaseSelect.mockReset();
    mockSupabaseUpdate.mockReset();
    mockSupabaseInsert.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with null/empty state', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isGuestMode: false,
      } as MockAuthState);

      const { result } = renderHook(() => useSupabaseData());

      expect(result.current.profile).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.pets).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should have isGuestMode property', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);

      const { result } = renderHook(() => useSupabaseData());

      expect(result.current.isGuestMode).toBe(true);
    });
  });

  describe('guest mode - loading data', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);
    });

    it('should load guest data from localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
        expect(result.current.progress).toEqual(mockProgress);
        expect(result.current.pets).toEqual([mockPet]);
      });
    });

    it('should create default data when localStorage is empty', async () => {
      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull();
        expect(result.current.profile?.display_name).toBe('Pet Paradise Player');
        expect(result.current.progress).not.toBeNull();
        expect(result.current.progress?.total_xp).toBe(0);
        expect(result.current.pets.length).toBe(1);
        expect(result.current.pets[0].pet_type).toBe('panda');
      });
    });

    it('should create default data when user_id does not match', async () => {
      const otherUserProfile = { ...mockProfile, user_id: 'other-user-id' };
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(otherUserProfile));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.profile?.user_id).toBe('test-user-id');
      });
    });
  });

  describe('guest mode - updating profile', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);
    });

    it('should update profile in localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull();
      });

      act(() => {
        result.current.updateProfile({ display_name: 'Updated Name' });
      });

      await waitFor(() => {
        expect(result.current.profile?.display_name).toBe('Updated Name');
      });

      const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
      expect(savedProfile.display_name).toBe('Updated Name');
      expect(toast.success).toHaveBeenCalledWith('Profile updated');
    });
  });

  describe('guest mode - updating progress', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);
    });

    it('should update progress in localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull();
      });

      act(() => {
        result.current.updateProgress({ total_xp: 1000 });
      });

      await waitFor(() => {
        expect(result.current.progress?.total_xp).toBe(1000);
      });

      const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.progress) || '{}');
      expect(savedProgress.total_xp).toBe(1000);
    });
  });

  describe('guest mode - adding focus session', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);
    });

    it('should add focus session to localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull();
      });

      await act(async () => {
        await result.current.addFocusSession(30, 100);
      });

      const savedSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.focusSessions) || '[]');
      expect(savedSessions.length).toBe(1);
      expect(savedSessions[0].duration_minutes).toBe(30);
      expect(savedSessions[0].xp_earned).toBe(100);
    });

    it('should update progress after adding focus session', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.progress?.total_xp).toBe(500);
      });

      await act(async () => {
        await result.current.addFocusSession(30, 100);
      });

      await waitFor(() => {
        expect(result.current.progress?.total_xp).toBe(600);
        expect(result.current.progress?.total_sessions).toBe(26);
      });
    });
  });

  describe('guest mode - managing pets', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);
    });

    it('should add a new pet', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.pets.length).toBe(1);
      });

      await act(async () => {
        await result.current.addPet('dog', 'Buddy');
      });

      await waitFor(() => {
        expect(result.current.pets.length).toBe(2);
        expect(result.current.pets[1].pet_type).toBe('dog');
        expect(result.current.pets[1].name).toBe('Buddy');
      });

      expect(toast.success).toHaveBeenCalledWith('Buddy joined your island!');
    });

    it('should update an existing pet', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([mockPet]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.pets.length).toBe(1);
      });

      await act(async () => {
        await result.current.updatePet('pet-123', { mood: 100, bond_level: 5 });
      });

      await waitFor(() => {
        expect(result.current.pets[0].mood).toBe(100);
        expect(result.current.pets[0].bond_level).toBe(5);
      });

      const savedPets = JSON.parse(localStorage.getItem(STORAGE_KEYS.pets) || '[]');
      expect(savedPets[0].mood).toBe(100);
    });
  });

  describe('authenticated mode - loading from Supabase', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: false,
      } as MockAuthState);
    });

    it('should load data from Supabase when authenticated', async () => {
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
        }),
      });
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ data: [mockPet], error: null }),
      });

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle Supabase errors gracefully', async () => {
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'SOME_ERROR', message: 'Database error' }
          }),
        }),
      });

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('loadUserData', () => {
    it('should be callable and not throw', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);

      const { result } = renderHook(() => useSupabaseData());

      await act(async () => {
        await result.current.loadUserData();
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should not load data when user is null', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isGuestMode: false,
      } as MockAuthState);

      const { result } = renderHook(() => useSupabaseData());

      await act(async () => {
        await result.current.loadUserData();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.pets).toEqual([]);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isGuestMode: true,
      } as MockAuthState);
    });

    it('should handle localStorage parse errors', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, 'invalid json');

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        // Should create defaults when parsing fails
        expect(result.current.profile).not.toBeNull();
      });
    });

    it('should handle empty pets array and create default', async () => {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(mockProfile));
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(mockProgress));
      localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify([]));

      const { result } = renderHook(() => useSupabaseData());

      await waitFor(() => {
        expect(result.current.pets.length).toBe(1);
        expect(result.current.pets[0].pet_type).toBe('panda');
      });
    });
  });

  describe('return value structure', () => {
    it('should return all expected properties and methods', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isGuestMode: false,
      } as MockAuthState);

      const { result } = renderHook(() => useSupabaseData());

      expect(result.current).toHaveProperty('profile');
      expect(result.current).toHaveProperty('progress');
      expect(result.current).toHaveProperty('pets');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isGuestMode');
      expect(result.current).toHaveProperty('loadUserData');
      expect(result.current).toHaveProperty('updateProfile');
      expect(result.current).toHaveProperty('updateProgress');
      expect(result.current).toHaveProperty('addFocusSession');
      expect(result.current).toHaveProperty('addPet');
      expect(result.current).toHaveProperty('updatePet');

      expect(typeof result.current.loadUserData).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.updateProgress).toBe('function');
      expect(typeof result.current.addFocusSession).toBe('function');
      expect(typeof result.current.addPet).toBe('function');
      expect(typeof result.current.updatePet).toBe('function');
    });
  });
});
