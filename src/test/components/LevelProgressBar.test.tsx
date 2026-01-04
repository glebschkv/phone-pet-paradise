import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelProgressBar } from '@/components/LevelProgressBar';

describe('LevelProgressBar', () => {
  const defaultProps = {
    currentLevel: 5,
    progress: 45,
    currentXP: 150,
    xpToNextLevel: 200,
  };

  describe('Rendering', () => {
    it('renders the component with all required elements', () => {
      render(<LevelProgressBar {...defaultProps} />);

      expect(screen.getByText('Current Level')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('To Next Level')).toBeInTheDocument();
      expect(screen.getByText('200 XP')).toBeInTheDocument();
    });

    it('displays current level correctly', () => {
      render(<LevelProgressBar {...defaultProps} currentLevel={10} />);
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays XP to next level correctly', () => {
      render(<LevelProgressBar {...defaultProps} xpToNextLevel={500} />);
      expect(screen.getByText('500 XP')).toBeInTheDocument();
    });

    it('displays progress percentage correctly', () => {
      render(<LevelProgressBar {...defaultProps} progress={75} />);
      expect(screen.getByText('75% complete')).toBeInTheDocument();
    });

    it('displays current XP correctly', () => {
      render(<LevelProgressBar {...defaultProps} currentXP={250} />);
      expect(screen.getByText('250 XP')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('rounds progress percentage to nearest integer', () => {
      render(<LevelProgressBar {...defaultProps} progress={33.7} />);
      expect(screen.getByText('34% complete')).toBeInTheDocument();
    });

    it('handles 0% progress', () => {
      render(<LevelProgressBar {...defaultProps} progress={0} />);
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('handles 100% progress', () => {
      render(<LevelProgressBar {...defaultProps} progress={100} />);
      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles level 0', () => {
      render(<LevelProgressBar {...defaultProps} currentLevel={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very high levels', () => {
      render(<LevelProgressBar {...defaultProps} currentLevel={999} />);
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('handles zero XP', () => {
      render(<LevelProgressBar {...defaultProps} currentXP={0} xpToNextLevel={0} />);
      expect(screen.getAllByText('0 XP')).toHaveLength(2);
    });

    it('handles large XP values', () => {
      render(<LevelProgressBar {...defaultProps} currentXP={99999} xpToNextLevel={100000} />);
      expect(screen.getByText('99999 XP')).toBeInTheDocument();
      expect(screen.getByText('100000 XP')).toBeInTheDocument();
    });
  });
});
