import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';

export interface PetBond {
  petId: string;
  level: number;
  experience: number;
  lastInteraction: string | null;
  totalInteractions: number;
  favoriteActivity?: string;
}

interface BondState {
  bonds: Record<string, PetBond>;
  activePetId: string | null;
}

interface BondStore extends BondState {
  getBond: (petId: string) => PetBond;
  setBond: (petId: string, bond: Partial<PetBond>) => void;
  addExperience: (petId: string, exp: number) => void;
  setActivePet: (petId: string | null) => void;
  recordInteraction: (petId: string, activity?: string) => void;
  getTopBonds: (limit?: number) => PetBond[];
  resetBonds: () => void;
}

const createDefaultBond = (petId: string): PetBond => ({
  petId, level: 1, experience: 0, lastInteraction: null, totalInteractions: 0,
});

const getExpRequired = (level: number): number => Math.floor(100 * Math.pow(1.2, level - 1));

const initialState: BondState = { bonds: {}, activePetId: null };

export const useBondStore = create<BondStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      getBond: (petId) => get().bonds[petId] || createDefaultBond(petId),
      setBond: (petId, bondUpdate) => set((s) => ({
        bonds: { ...s.bonds, [petId]: { ...(s.bonds[petId] || createDefaultBond(petId)), ...bondUpdate } }
      })),
      addExperience: (petId, exp) => {
        const { bonds } = get();
        const existing = bonds[petId] || createDefaultBond(petId);
        let newExp = existing.experience + exp;
        let newLevel = existing.level;
        while (newExp >= getExpRequired(newLevel)) { newExp -= getExpRequired(newLevel); newLevel++; }
        set({ bonds: { ...bonds, [petId]: { ...existing, experience: newExp, level: newLevel } } });
      },
      setActivePet: (petId) => set({ activePetId: petId }),
      recordInteraction: (petId, activity) => {
        const { bonds } = get();
        const existing = bonds[petId] || createDefaultBond(petId);
        set({ bonds: { ...bonds, [petId]: {
          ...existing, lastInteraction: new Date().toISOString(), totalInteractions: existing.totalInteractions + 1,
          favoriteActivity: activity || existing.favoriteActivity
        }}});
      },
      getTopBonds: (limit = 5) => Object.values(get().bonds)
        .sort((a, b) => b.level !== a.level ? b.level - a.level : b.experience - a.experience)
        .slice(0, limit),
      resetBonds: () => set(initialState),
    }),
    {
      name: 'nomo_pet_bonds',
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const legacy = localStorage.getItem('pet-bond-data') || localStorage.getItem('pet_paradise_bond_data');
            if (legacy) { const parsed = JSON.parse(legacy); return { bonds: parsed.bonds || {}, activePetId: parsed.activePetId || null }; }
          } catch { /* ignore */ }
        }
        if (state) logger.debug('Bond store rehydrated');
      },
    }
  )
);

export const useBonds = () => useBondStore((s) => s.bonds);
export const useActivePetId = () => useBondStore((s) => s.activePetId);
export const usePetBond = (petId: string) => useBondStore((s) => s.bonds[petId] || createDefaultBond(petId));
