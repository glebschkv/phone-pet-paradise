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
import { XPReward } from "@/hooks/useXPSystem";
import { DailyReward, DailyLoginState } from "@/hooks/useDailyLoginRewards";

interface DailyLoginRewards {
  showRewardModal: boolean;
  pendingReward: DailyReward | null;
  loginState: DailyLoginState;
  dailyRewards: DailyReward[];
  dismissModal: () => void;
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
  currentReward: XPReward | null;
  newLevel: number;
  levelProgress: number;

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
