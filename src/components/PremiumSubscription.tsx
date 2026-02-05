import { useState } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  Volume2,
  Timer,
  BarChart3,
  Zap,
  Star,
  RefreshCw,
  Music,
  Settings,
  Snowflake,
  Award,
  Infinity as InfinityIcon,
  Loader2,
  Shield,
  Dices,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { usePremiumStatus, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/hooks/usePremiumStatus';
import { useStoreKit } from '@/hooks/useStoreKit';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface PremiumSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

// Compact feature display
const FEATURE_MAP: Record<string, { icon: React.ReactNode; label: string; comingSoon?: boolean }> = {
  '1.5x Coin & XP multiplier': { icon: <Zap className="w-3.5 h-3.5" />, label: '1.5x Coins & XP' },
  '2x Coin & XP multiplier': { icon: <Zap className="w-3.5 h-3.5" />, label: '2x Coins & XP' },
  '2.5x Coin & XP multiplier': { icon: <Zap className="w-3.5 h-3.5" />, label: '2.5x Coins & XP' },
  'All 13 ambient sounds': { icon: <Volume2 className="w-3.5 h-3.5" />, label: '13 Sounds' },
  'Auto-break Pomodoro cycles': { icon: <Timer className="w-3.5 h-3.5" />, label: 'Auto Pomodoro' },
  'Session notes & reflections': { icon: <PenLine className="w-3.5 h-3.5" />, label: 'Session Notes' },
  'Focus analytics dashboard': { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Analytics' },
  '2 Lucky Wheel spins/day': { icon: <Dices className="w-3.5 h-3.5" />, label: '2 Spins/day' },
  '3 Lucky Wheel spins/day': { icon: <Dices className="w-3.5 h-3.5" />, label: '3 Spins/day' },
  '1.5x Daily login coins': { icon: <PixelIcon name="coin" size={14} />, label: '1.5x Login Coins' },
  '2x Daily login coins': { icon: <PixelIcon name="coin" size={14} />, label: '2x Login Coins' },
  'Full analytics dashboard': { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Full Analytics' },
  '2 Streak Freezes/month': { icon: <Snowflake className="w-3.5 h-3.5" />, label: '2 Freezes/mo' },
  '5 Streak Freezes/month': { icon: <Snowflake className="w-3.5 h-3.5" />, label: '5 Freezes/mo' },
  '7 Streak Freezes/month': { icon: <Snowflake className="w-3.5 h-3.5" />, label: '7 Freezes/mo' },
  'Sound mixing (2 layers)': { icon: <Music className="w-3.5 h-3.5" />, label: '2-Layer Mix' },
  'Sound mixing (3 layers)': { icon: <Music className="w-3.5 h-3.5" />, label: '3-Layer Mix' },
  '3 Focus presets': { icon: <Settings className="w-3.5 h-3.5" />, label: '3 Presets' },
  '5 Focus presets': { icon: <Settings className="w-3.5 h-3.5" />, label: '5 Presets' },
  '10 Focus presets': { icon: <Settings className="w-3.5 h-3.5" />, label: '10 Presets' },
  'Everything in Premium': { icon: <Check className="w-3.5 h-3.5" />, label: 'All Premium' },
  'Everything in Premium+': { icon: <Check className="w-3.5 h-3.5" />, label: 'All Premium+' },
  'Battle Pass Premium included': { icon: <Award className="w-3.5 h-3.5" />, label: 'Battle Pass', comingSoon: true },
  'Early access to features': { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Early Access' },
  'Exclusive profile frames': { icon: <Star className="w-3.5 h-3.5" />, label: 'Profile Frames', comingSoon: true },
  'No recurring fees ever': { icon: <InfinityIcon className="w-3.5 h-3.5" />, label: 'Pay Once' },
  'All future updates included': { icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'All Updates' },
  'Exclusive Founder badge': { icon: <PixelIcon name="founder-badge" size={14} />, label: 'Founder Badge' },
  'Founder-only legendary pet': { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Legendary Pet' },
};

// Tier-specific colors using the retro dark palette
const TIER_CONFIG = {
  premium: {
    // Header strip
    headerGradient: 'from-amber-500 to-orange-500',
    // Card border (colored)
    borderHsl: 'hsl(35 80% 50%)',
    glowHsl: 'hsl(35 100% 50% / 0.15)',
    // Neon accent class for price
    neonClass: 'retro-neon-orange',
    // Icon color in features
    iconColor: 'text-amber-400',
    // Feature pill border color
    featureBorder: 'border-amber-500/25',
    // Button style (retro-arcade-btn variant)
    btnGradient: 'linear-gradient(180deg, hsl(35 80% 55%) 0%, hsl(35 85% 45%) 50%, hsl(35 90% 35%) 100%)',
    btnBorder: 'hsl(35 70% 65%)',
    btnShadow: 'hsl(35 90% 25%)',
    btnInset: 'hsl(35 60% 70%)',
    btnGlow: 'hsl(35 100% 50% / 0.4)',
    // Icon in header
    icon: <Star className="w-4 h-4 text-white" />,
    // Bonus coins color
    bonusColor: 'text-amber-400',
  },
  premium_plus: {
    headerGradient: 'from-purple-500 to-pink-500',
    borderHsl: 'hsl(280 70% 55%)',
    glowHsl: 'hsl(280 100% 50% / 0.2)',
    neonClass: 'retro-neon-pink',
    iconColor: 'text-purple-400',
    featureBorder: 'border-purple-500/25',
    btnGradient: 'linear-gradient(180deg, hsl(280 70% 55%) 0%, hsl(280 75% 45%) 50%, hsl(280 80% 35%) 100%)',
    btnBorder: 'hsl(280 60% 65%)',
    btnShadow: 'hsl(280 80% 25%)',
    btnInset: 'hsl(280 50% 70%)',
    btnGlow: 'hsl(280 100% 50% / 0.4)',
    icon: <Sparkles className="w-4 h-4 text-white" />,
    bonusColor: 'text-purple-400',
  },
  lifetime: {
    headerGradient: 'from-amber-400 via-yellow-400 to-orange-400',
    borderHsl: 'hsl(50 90% 55%)',
    glowHsl: 'hsl(50 100% 50% / 0.25)',
    neonClass: 'retro-neon-yellow',
    iconColor: 'text-yellow-400',
    featureBorder: 'border-yellow-500/25',
    btnGradient: 'linear-gradient(180deg, hsl(45 90% 55%) 0%, hsl(40 85% 48%) 50%, hsl(35 90% 38%) 100%)',
    btnBorder: 'hsl(50 80% 65%)',
    btnShadow: 'hsl(40 90% 25%)',
    btnInset: 'hsl(50 70% 72%)',
    btnGlow: 'hsl(50 100% 50% / 0.5)',
    icon: <Crown className="w-4 h-4 text-white" />,
    bonusColor: 'text-yellow-400',
  },
};

export const PremiumSubscription = ({ isOpen, onClose }: PremiumSubscriptionProps) => {
  const { isPremium, currentPlan, purchaseSubscription, restorePurchases, tier, grantBonusCoins, isLifetime } = usePremiumStatus();
  const storeKit = useStoreKit();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const handlePurchase = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    setPurchaseError(null);

    if (isNative) {
      const result = await storeKit.purchaseProduct(plan.iapProductId);
      setIsProcessing(false);

      if (result.success) {
        const bonusResult = grantBonusCoins(plan.id);
        if (bonusResult.granted) {
          toast.success(`Purchase successful! +${bonusResult.amount.toLocaleString()} bonus coins!`);
        } else {
          toast.success('Purchase successful!');
        }
        onClose();
      } else if (!result.cancelled) {
        setPurchaseError(result.message || 'Purchase failed. Please try again.');
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = purchaseSubscription(plan.id);
      setIsProcessing(false);

      if (result.success) {
        const bonusResult = grantBonusCoins(plan.id);
        if (bonusResult.granted) {
          toast.success(`${result.message} +${bonusResult.amount.toLocaleString()} bonus coins!`);
        } else {
          toast.success(result.message);
        }
        onClose();
      } else {
        setPurchaseError(result.message || 'Purchase failed. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);

    if (isNative) {
      await storeKit.restorePurchases();
      setIsRestoring(false);
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = restorePurchases();
      setIsRestoring(false);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    }
  };

  const premiumPlans = SUBSCRIPTION_PLANS.filter(
    p => p.tier === 'premium' && p.period === selectedPeriod
  );
  const premiumPlusPlans = SUBSCRIPTION_PLANS.filter(
    p => p.tier === 'premium_plus' && p.period === selectedPeriod
  );
  const lifetimePlan = SUBSCRIPTION_PLANS.find(p => p.period === 'lifetime');

  const renderPlanCard = (plan: SubscriptionPlan, tierKey: 'premium' | 'premium_plus' | 'lifetime') => {
    const config = TIER_CONFIG[tierKey];
    const isCurrentTier = (tierKey === 'premium' && tier === 'premium') ||
                          (tierKey === 'premium_plus' && (tier === 'premium_plus' || isLifetime)) ||
                          (tierKey === 'lifetime' && isLifetime);

    return (
      <div
        key={plan.id}
        className="relative rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
          border: `3px solid ${config.borderHsl}`,
          boxShadow: `0 4px 0 hsl(260 50% 12%), 0 0 20px ${config.glowHsl}`,
        }}
      >
        {/* Tier header strip */}
        <div className={cn(
          "relative bg-gradient-to-r px-3 py-2",
          config.headerGradient,
        )}>
          <div className="retro-scanlines" />
          <div className="flex items-center justify-between relative z-[1]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                {config.icon}
              </div>
              <span
                className="font-black text-white uppercase tracking-wider text-sm"
                style={{ textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}
              >
                {plan.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {plan.isPopular && (
                <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-wider border border-white/20">
                  Popular
                </span>
              )}
              {tierKey === 'lifetime' && (
                <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-wider border border-white/20">
                  Best Value
                </span>
              )}
              {plan.savings && tierKey !== 'lifetime' && (
                <span
                  className="px-2 py-0.5 rounded text-[8px] font-black text-white uppercase border"
                  style={{
                    background: 'linear-gradient(180deg, hsl(120 70% 45%), hsl(120 75% 35%))',
                    borderColor: 'hsl(120 60% 55%)',
                    boxShadow: '0 0 8px hsl(120 100% 40% / 0.4)',
                  }}
                >
                  {plan.savings}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card body — dark retro */}
        <div className="p-3 relative">
          {/* Top shine line */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(260 40% 40%) 50%, transparent 100%)' }}
          />

          {/* Price row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px]" style={{ color: 'hsl(260 20% 55%)' }}>
                {plan.description}
              </p>
              {plan.bonusCoins > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <PixelIcon name="coin" size={14} />
                  <span className={cn("text-[11px] font-bold", config.bonusColor)}>
                    +{plan.bonusCoins.toLocaleString()} bonus coins
                  </span>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <span className={cn("text-2xl font-black retro-pixel-text", config.neonClass)}>
                {plan.price}
              </span>
              <span className="text-[10px] block" style={{ color: 'hsl(260 20% 50%)' }}>
                {plan.period === 'monthly' ? '/month' : plan.period === 'yearly' ? '/year' : 'one-time'}
              </span>
            </div>
          </div>

          {/* Features — retro-reward-item style */}
          <div className="grid grid-cols-2 gap-1 mb-3">
            {plan.features.map((feature) => {
              const mapped = FEATURE_MAP[feature];
              return (
                <div
                  key={feature}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded border relative",
                    config.featureBorder,
                    mapped?.comingSoon && "opacity-75",
                  )}
                  style={{
                    background: 'linear-gradient(180deg, hsl(260 25% 22%) 0%, hsl(260 30% 17%) 100%)',
                  }}
                >
                  <div className={cn("flex-shrink-0", config.iconColor)}>
                    {mapped?.icon || <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-tight truncate"
                    style={{ color: 'hsl(260 20% 80%)' }}
                  >
                    {mapped?.label || feature}
                  </span>
                  {mapped?.comingSoon && (
                    <span
                      className="absolute -top-1.5 -right-1 px-1 py-0.5 rounded text-[6px] font-black uppercase"
                      style={{
                        background: 'linear-gradient(180deg, hsl(200 70% 50%), hsl(200 75% 40%))',
                        color: 'white',
                        border: '1px solid hsl(200 60% 60%)',
                        boxShadow: '0 0 4px hsl(200 100% 50% / 0.4)',
                      }}
                    >
                      Soon
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Purchase button — retro-arcade-btn inline style */}
          <button
            onClick={() => handlePurchase(plan)}
            disabled={isProcessing || isCurrentTier}
            className="w-full py-2.5 rounded-lg border-[3px] font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 text-white active:translate-y-1"
            style={isCurrentTier ? {
              background: 'linear-gradient(180deg, hsl(260 20% 25%) 0%, hsl(260 25% 18%) 100%)',
              borderColor: 'hsl(260 20% 35%)',
              color: 'hsl(260 15% 45%)',
              boxShadow: '0 4px 0 hsl(260 30% 12%)',
              cursor: 'not-allowed',
            } : {
              background: config.btnGradient,
              borderColor: config.btnBorder,
              boxShadow: `0 5px 0 ${config.btnShadow}, inset 0 2px 0 ${config.btnInset}, 0 0 15px ${config.btnGlow}`,
              textShadow: '0 2px 0 rgba(0,0,0,0.3)',
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isCurrentTier ? (
              <>
                <Check className="w-4 h-4" />
                <span>Current Plan</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {tierKey === 'lifetime' ? 'Get Lifetime Access' : tierKey === 'premium_plus' ? 'Upgrade to Plus' : 'Subscribe Now'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="retro-modal max-w-[340px] p-0 overflow-hidden border-0 max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Go Premium</DialogTitle>
        </VisuallyHidden>
        <>
          {/* Header */}
          <div className="retro-modal-header p-5 text-center relative">
            <div className="retro-scanlines" />

            {/* Crown with glow */}
            <div className="relative inline-flex items-center justify-center mb-3 z-[1]">
              <div className="absolute inset-0 rounded-full blur-xl scale-[2.5]" style={{ background: 'hsl(35 100% 50% / 0.25)' }} />
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(35 90% 55%) 0%, hsl(25 90% 50%) 100%)',
                  border: '3px solid hsl(40 80% 65%)',
                  boxShadow: '0 4px 0 hsl(25 80% 30%), 0 0 20px hsl(35 100% 50% / 0.4), inset 0 2px 0 hsl(40 70% 72%)',
                }}
              >
                <Crown className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.3))' }} />
              </div>
            </div>

            <h2
              className="text-xl font-black uppercase tracking-wider text-white relative z-[1]"
              style={{ textShadow: '0 0 10px hsl(260 80% 70% / 0.5), 0 2px 0 rgba(0,0,0,0.3)' }}
            >
              Go Premium
            </h2>
            <p className="text-[11px] mt-1 relative z-[1]" style={{ color: 'hsl(260 30% 65%)' }}>
              Unlock all features & supercharge your focus
            </p>

            {/* Period Toggle — arcade pill style */}
            <div
              className="flex mt-4 p-1 rounded-lg relative z-[1]"
              style={{
                background: 'linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 35% 8%) 100%)',
                border: '2px solid hsl(260 35% 30%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className="flex-1 py-2 rounded-md text-xs font-black transition-all uppercase tracking-wider"
                style={selectedPeriod === 'monthly' ? {
                  background: 'linear-gradient(180deg, hsl(260 40% 35%) 0%, hsl(260 45% 28%) 100%)',
                  color: 'white',
                  border: '2px solid hsl(260 50% 50%)',
                  boxShadow: '0 0 10px hsl(260 80% 50% / 0.3)',
                  textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                } : {
                  background: 'transparent',
                  color: 'hsl(260 20% 45%)',
                  border: '2px solid transparent',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('yearly')}
                className="flex-1 py-2 rounded-md text-xs font-black transition-all uppercase tracking-wider relative"
                style={selectedPeriod === 'yearly' ? {
                  background: 'linear-gradient(180deg, hsl(260 40% 35%) 0%, hsl(260 45% 28%) 100%)',
                  color: 'white',
                  border: '2px solid hsl(260 50% 50%)',
                  boxShadow: '0 0 10px hsl(260 80% 50% / 0.3)',
                  textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                } : {
                  background: 'transparent',
                  color: 'hsl(260 20% 45%)',
                  border: '2px solid transparent',
                }}
              >
                Yearly
                <span
                  className="absolute -top-2.5 -right-1 px-1.5 py-0.5 rounded text-[7px] font-black text-white uppercase"
                  style={{
                    background: 'linear-gradient(180deg, hsl(120 70% 45%), hsl(120 75% 35%))',
                    border: '1px solid hsl(120 60% 55%)',
                    boxShadow: '0 0 8px hsl(120 100% 40% / 0.5)',
                  }}
                >
                  Save 33%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards — dark retro body */}
          <div className="p-3 space-y-3" style={{ background: 'linear-gradient(180deg, hsl(260 28% 13%) 0%, hsl(275 22% 10%) 100%)' }}>
            {/* Purchase error banner */}
            {purchaseError && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, hsl(0 30% 20%) 0%, hsl(0 35% 15%) 100%)',
                  border: '2px solid hsl(0 50% 40%)',
                  boxShadow: '0 0 10px hsl(0 100% 40% / 0.2)',
                }}
              >
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(0 70% 60%)' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block" style={{ color: 'hsl(0 70% 70%)' }}>Purchase failed</span>
                  <span className="text-[10px] block mt-0.5" style={{ color: 'hsl(0 20% 55%)' }}>
                    {purchaseError}
                  </span>
                </div>
                <button
                  onClick={() => setPurchaseError(null)}
                  className="text-[10px] font-bold flex-shrink-0 px-2 py-1 rounded"
                  style={{ color: 'hsl(0 20% 55%)', background: 'hsl(0 20% 25%)' }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Already Premium banner */}
            {isPremium && currentPlan && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, hsl(140 30% 20%) 0%, hsl(140 35% 15%) 100%)',
                  border: '2px solid hsl(140 50% 40%)',
                  boxShadow: '0 0 10px hsl(140 100% 40% / 0.2)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(140 60% 40%)', border: '2px solid hsl(140 50% 55%)' }}
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold retro-neon-green">{currentPlan.name} Active</span>
                  <span className="text-[10px] block" style={{ color: 'hsl(140 20% 55%)' }}>
                    Thank you for supporting NoMo!
                  </span>
                </div>
              </div>
            )}

            {/* Premium */}
            {premiumPlans.map((plan) => renderPlanCard(plan, 'premium'))}

            {/* Premium+ */}
            {premiumPlusPlans.map((plan) => renderPlanCard(plan, 'premium_plus'))}

            {/* Lifetime */}
            {lifetimePlan && renderPlanCard(lifetimePlan, 'lifetime')}

            {/* Restore Purchases */}
            <button
              onClick={handleRestore}
              disabled={isRestoring || isProcessing}
              className={cn(
                "w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all",
                (isRestoring || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: 'transparent',
                border: '2px solid hsl(260 30% 30%)',
                color: 'hsl(260 20% 55%)',
              }}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRestoring && "animate-spin")} />
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </button>

            {/* Terms */}
            <p className="text-[9px] text-center leading-relaxed pb-1" style={{ color: 'hsl(260 15% 40%)' }}>
              Subscriptions auto-renew unless cancelled 24h before period ends. Manage in Apple ID settings.
            </p>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};
