import { useState, useEffect, useCallback } from 'react';

export interface WheelSegment {
  id: number;
  label: string;
  shortLabel: string;
  type: 'xp' | 'streak_freeze' | 'bonus_xp' | 'jackpot' | 'small_xp';
  value: number;
  color: string;
  probability: number; // Weight for probability calculation
  icon: string;
}

export interface SpinWheelState {
  lastSpinDate: string;
  totalSpins: number;
  hasSpunToday: boolean;
}

export interface SpinResult {
  segment: WheelSegment;
  rotation: number;
}

// Wheel segments - probabilities should add up to 100
const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 0, label: '10 XP', shortLabel: '10', type: 'small_xp', value: 10, color: '#6366f1', probability: 25, icon: '⭐' },
  { id: 1, label: '25 XP', shortLabel: '25', type: 'xp', value: 25, color: '#8b5cf6', probability: 20, icon: '✨' },
  { id: 2, label: '50 XP', shortLabel: '50', type: 'xp', value: 50, color: '#a855f7', probability: 15, icon: '💫' },
  { id: 3, label: 'Streak Freeze', shortLabel: '🧊', type: 'streak_freeze', value: 1, color: '#06b6d4', probability: 10, icon: '🧊' },
  { id: 4, label: '75 XP', shortLabel: '75', type: 'bonus_xp', value: 75, color: '#10b981', probability: 12, icon: '🌟' },
  { id: 5, label: '100 XP', shortLabel: '100', type: 'bonus_xp', value: 100, color: '#22c55e', probability: 8, icon: '💎' },
  { id: 6, label: '150 XP', shortLabel: '150', type: 'bonus_xp', value: 150, color: '#eab308', probability: 5, icon: '🔥' },
  { id: 7, label: 'JACKPOT 500', shortLabel: '500', type: 'jackpot', value: 500, color: '#f59e0b', probability: 5, icon: '🎰' },
];

const STORAGE_KEY = 'pet_paradise_spin_wheel';

export const useSpinWheel = () => {
  const [wheelState, setWheelState] = useState<SpinWheelState>({
    lastSpinDate: '',
    totalSpins: 0,
    hasSpunToday: false,
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);

  // Load saved state
  useEffect(() => {
    loadWheelState();
  }, []);

  const loadWheelState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as SpinWheelState;
        const today = new Date().toDateString();

        // Check if already spun today
        if (data.lastSpinDate === today) {
          setWheelState({ ...data, hasSpunToday: true });
        } else {
          // New day - can spin again
          setWheelState({ ...data, hasSpunToday: false });
        }
      } catch (error) {
        console.error('Failed to load spin wheel state:', error);
      }
    }
  };

  const saveWheelState = (data: SpinWheelState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setWheelState(data);
  };

  // Weighted random selection based on probability
  const selectRandomSegment = useCallback((): WheelSegment => {
    const totalWeight = WHEEL_SEGMENTS.reduce((sum, seg) => sum + seg.probability, 0);
    let random = Math.random() * totalWeight;

    for (const segment of WHEEL_SEGMENTS) {
      random -= segment.probability;
      if (random <= 0) {
        return segment;
      }
    }

    // Fallback to first segment
    return WHEEL_SEGMENTS[0];
  }, []);

  // Calculate rotation to land on specific segment
  const calculateRotation = useCallback((segmentId: number): number => {
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const segmentCenter = segmentId * segmentAngle + segmentAngle / 2;

    // Add multiple full rotations (5-8 spins) for dramatic effect
    const fullRotations = (5 + Math.floor(Math.random() * 4)) * 360;

    // The wheel spins clockwise, pointer is at top (0 degrees)
    // We need to calculate where segment should stop
    // Add some randomness within the segment for realism
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.6);

    // Subtract from 360 because wheel spins clockwise
    const targetAngle = 360 - segmentCenter + randomOffset;

    return fullRotations + targetAngle;
  }, []);

  const spin = useCallback((): Promise<SpinResult> => {
    return new Promise((resolve) => {
      if (wheelState.hasSpunToday || isSpinning) {
        resolve({ segment: WHEEL_SEGMENTS[0], rotation: 0 });
        return;
      }

      setIsSpinning(true);

      // Select winning segment
      const winningSegment = selectRandomSegment();
      const rotation = calculateRotation(winningSegment.id);

      const result: SpinResult = {
        segment: winningSegment,
        rotation,
      };

      setLastResult(result);

      // Update state after spin animation completes (4 seconds)
      setTimeout(() => {
        const today = new Date().toDateString();
        const updatedState: SpinWheelState = {
          lastSpinDate: today,
          totalSpins: wheelState.totalSpins + 1,
          hasSpunToday: true,
        };
        saveWheelState(updatedState);
        setIsSpinning(false);
        resolve(result);
      }, 4000);
    });
  }, [wheelState, isSpinning, selectRandomSegment, calculateRotation]);

  const openWheel = useCallback(() => {
    setShowWheelModal(true);
    setLastResult(null);
  }, []);

  const closeWheel = useCallback(() => {
    setShowWheelModal(false);
    setLastResult(null);
  }, []);

  const canSpin = !wheelState.hasSpunToday && !isSpinning;

  const getTimeUntilNextSpin = useCallback((): string => {
    if (!wheelState.hasSpunToday) return 'Ready to spin!';

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }, [wheelState.hasSpunToday]);

  return {
    wheelState,
    isSpinning,
    showWheelModal,
    lastResult,
    canSpin,
    spin,
    openWheel,
    closeWheel,
    getTimeUntilNextSpin,
    segments: WHEEL_SEGMENTS,
  };
};
