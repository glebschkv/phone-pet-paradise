import { useCallback } from 'react';
import type { WebkitWindow } from '@/types/browser-utils';

export const useTimerAudio = () => {
  const playCompletionSound = useCallback(() => {
    try {
      const windowWithWebkit = window as WebkitWindow;
      const AudioContextClass = window.AudioContext || windowWithWebkit.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Audio not supported - silent fail
    }
  }, []);

  return { playCompletionSound };
};
