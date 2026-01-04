/**
 * RewardModals Component
 *
 * Groups all reward-related modals in one place:
 * - XPRewardModal: Shows XP reward and level up
 * - DailyLoginRewardModal: Shows daily login rewards
 * - MilestoneCelebration: Shows milestone celebrations
 *
 * Wraps each modal in an error boundary for resilience.
 */

import { XPRewardModal } from "@/components/XPRewardModal";
import { DailyLoginRewardModal } from "@/components/DailyLoginRewardModal";
import { MilestoneCelebration } from "@/components/gamification";
import { RewardModalErrorBoundary } from "@/components/FeatureErrorBoundary";

interface DailyReward {
  type: string;
  amount: number;
  description?: string;
}

interface LoginState {
  currentStreak: number;
}

interface DailyLoginRewards {
  showRewardModal: boolean;
  pendingReward: DailyReward | null;
  loginState: LoginState;
  dailyRewards: DailyReward[];
  dismissModal: () => void;
}

interface Reward {
  name: string;
  type: string;
  amount?: number;
}

interface LevelProgress {
  current: number;
  max: number;
  percentage: number;
}

interface Milestone {
  rewards?: {
    xp?: number;
    coins?: number;
  };
}

interface RewardModalsProps {
  // XP Reward Modal
  showRewardModal: boolean;
  dismissRewardModal: () => void;
  currentReward: Reward | null;
  newLevel: number;
  levelProgress: LevelProgress;

  // Daily Login Reward Modal
  dailyLoginRewards: DailyLoginRewards;
  onDailyRewardClaim: () => void;

  // Milestone Celebration
  onMilestoneClaim: (milestone: Milestone) => void;
}

export const RewardModals = ({
  // XP Reward Modal
  showRewardModal,
  dismissRewardModal,
  currentReward,
  newLevel,
  levelProgress,

  // Daily Login Reward Modal
  dailyLoginRewards,
  onDailyRewardClaim,

  // Milestone Celebration
  onMilestoneClaim,
}: RewardModalsProps) => {
  return (
    <>
      {/* XP Reward Modal */}
      <RewardModalErrorBoundary>
        <XPRewardModal
          isOpen={showRewardModal}
          onClose={dismissRewardModal}
          reward={currentReward}
          newLevel={newLevel}
          levelProgress={levelProgress}
        />
      </RewardModalErrorBoundary>

      {/* Daily Login Reward Modal */}
      <RewardModalErrorBoundary>
        <DailyLoginRewardModal
          isOpen={dailyLoginRewards.showRewardModal}
          onClaim={onDailyRewardClaim}
          onDismiss={dailyLoginRewards.dismissModal}
          reward={dailyLoginRewards.pendingReward}
          currentStreak={dailyLoginRewards.loginState.currentStreak}
          allRewards={dailyLoginRewards.dailyRewards}
        />
      </RewardModalErrorBoundary>

      {/* Milestone Celebration */}
      <RewardModalErrorBoundary>
        <MilestoneCelebration onClaimReward={onMilestoneClaim} />
      </RewardModalErrorBoundary>
    </>
  );
};
