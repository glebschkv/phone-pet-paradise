import { useState } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  Volume2,
  Timer,
  PenLine,
  BarChart3,
  Zap,
  Star,
  RefreshCw,
  Coins,
  Music,
  Settings,
  Snowflake,
  Award,
  Infinity as InfinityIcon,
  Loader2,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePremiumStatus, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/hooks/usePremiumStatus';
import { useStoreKit } from '@/hooks/useStoreKit';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle } from '@/components/ui/dialog';

interface PremiumSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

// Compact feature display with icons and short labels
const FEATURE_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  '1.5x Coin & XP multiplier': { icon: <Zap className="w-3.5 h-3.5" />, label: '1.5x Coins & XP' },
  '2x Coin & XP multiplier': { icon: <Zap className="w-3.5 h-3.5" />, label: '2x Coins & XP' },
  '2.5x Coin & XP multiplier': { icon: <Zap className="w-3.5 h-3.5" />, label: '2.5x Coins & XP' },
  'All 13 ambient sounds': { icon: <Volume2 className="w-3.5 h-3.5" />, label: '13 Sounds' },
  'Auto-break Pomodoro cycles': { icon: <Timer className="w-3.5 h-3.5" />, label: 'Auto Pomodoro' },
  'Session notes & reflections': { icon: <PenLine className="w-3.5 h-3.5" />, label: 'Session Notes' },
  'Focus analytics dashboard': { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Analytics' },
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
  'Battle Pass Premium included': { icon: <Award className="w-3.5 h-3.5" />, label: 'Battle Pass' },
  'Early access to features': { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Early Access' },
  'Exclusive profile frames': { icon: <Star className="w-3.5 h-3.5" />, label: 'Profile Frames' },
  'No recurring fees ever': { icon: <InfinityIcon className="w-3.5 h-3.5" />, label: 'Pay Once' },
  'All future updates included': { icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'All Updates' },
  'Exclusive Founder badge': { icon: <Shield className="w-3.5 h-3.5" />, label: 'Founder Badge' },
  'Founder-only legendary pet': { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Legendary Pet' },
};

const TIER_CONFIG = {
  premium: {
    headerGradient: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-400/50 dark:border-amber-500/40',
    accentColor: 'text-amber-500',
    iconColor: 'text-amber-400',
    featureBg: 'bg-amber-500/8 border-amber-500/15',
    buttonGradient: 'from-amber-400 to-orange-500',
    buttonBorder: 'border-amber-600',
    buttonShadow: 'shadow-amber-700/40',
    icon: <Star className="w-4 h-4 text-white" />,
  },
  premium_plus: {
    headerGradient: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-400/50 dark:border-purple-500/40',
    accentColor: 'text-purple-500',
    iconColor: 'text-purple-400',
    featureBg: 'bg-purple-500/8 border-purple-500/15',
    buttonGradient: 'from-purple-500 to-pink-500',
    buttonBorder: 'border-purple-700',
    buttonShadow: 'shadow-purple-800/40',
    icon: <Sparkles className="w-4 h-4 text-white" />,
  },
  lifetime: {
    headerGradient: 'from-amber-400 via-yellow-400 to-orange-400',
    borderColor: 'border-yellow-400/50 dark:border-yellow-500/40',
    accentColor: 'text-yellow-500',
    iconColor: 'text-yellow-400',
    featureBg: 'bg-yellow-500/8 border-yellow-500/15',
    buttonGradient: 'from-amber-400 via-yellow-400 to-orange-400',
    buttonBorder: 'border-amber-600',
    buttonShadow: 'shadow-amber-700/40',
    icon: <Crown className="w-4 h-4 text-white" />,
  },
};

export const PremiumSubscription = ({ isOpen, onClose }: PremiumSubscriptionProps) => {
  const { isPremium, currentPlan, purchaseSubscription, restorePurchases, tier, grantBonusCoins, isLifetime } = usePremiumStatus();
  const storeKit = useStoreKit();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const handlePurchase = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);

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
        toast.error(result.message || 'Purchase failed');
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
        toast.error(result.message);
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
        className={cn(
          "relative rounded-xl border-2 overflow-hidden",
          config.borderColor,
          tierKey === 'lifetime' && "shadow-[0_0_20px_rgba(250,204,21,0.15)]",
          tierKey === 'premium_plus' && "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
        )}
      >
        {/* Tier header strip */}
        <div className={cn(
          "relative bg-gradient-to-r px-3 py-2",
          config.headerGradient,
        )}>
          <div className="retro-scanlines opacity-10" />
          <div className="flex items-center justify-between relative z-[1]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                {config.icon}
              </div>
              <span className="font-black text-white uppercase tracking-wide text-sm">
                {plan.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {plan.isPopular && (
                <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-[8px] font-black text-white uppercase tracking-wider">
                  Popular
                </span>
              )}
              {tierKey === 'lifetime' && (
                <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-[8px] font-black text-white uppercase tracking-wider">
                  Best Value
                </span>
              )}
              {plan.savings && tierKey !== 'lifetime' && (
                <span className="px-2 py-0.5 bg-green-500 rounded-full text-[8px] font-black text-white uppercase">
                  {plan.savings}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-3 bg-card">
          {/* Price row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] text-muted-foreground">{plan.description}</p>
              {plan.bonusCoins > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Coins className={cn("w-3 h-3", config.iconColor)} />
                  <span className={cn("text-[11px] font-bold", config.accentColor)}>
                    +{plan.bonusCoins.toLocaleString()} bonus coins
                  </span>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <span className={cn("text-xl font-black", config.accentColor)}>
                {plan.price}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {plan.period === 'monthly' ? '/month' : plan.period === 'yearly' ? '/year' : 'one-time'}
              </span>
            </div>
          </div>

          {/* Features in 2-col compact grid */}
          <div className="grid grid-cols-2 gap-1 mb-3">
            {plan.features.map((feature) => {
              const mapped = FEATURE_MAP[feature];
              return (
                <div
                  key={feature}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border",
                    config.featureBg,
                  )}
                >
                  <div className={cn("flex-shrink-0", config.iconColor)}>
                    {mapped?.icon || <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-semibold leading-tight truncate">
                    {mapped?.label || feature}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Purchase button */}
          <button
            onClick={() => handlePurchase(plan)}
            disabled={isProcessing || isCurrentTier}
            className={cn(
              "w-full py-2.5 rounded-xl border-2 font-black uppercase tracking-wide text-sm transition-all flex items-center justify-center gap-2",
              isCurrentTier
                ? "bg-muted border-border text-muted-foreground cursor-not-allowed"
                : cn(
                    "text-white active:translate-y-0.5 shadow-[0_3px_0]",
                    `bg-gradient-to-b ${config.buttonGradient}`,
                    config.buttonBorder,
                    config.buttonShadow,
                  ),
            )}
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
            <div className="retro-scanlines opacity-20" />

            {/* Crown with glow */}
            <div className="relative inline-flex items-center justify-center mb-3">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl scale-[2]" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-amber-300/50 shadow-lg shadow-amber-500/40">
                <Crown className="w-7 h-7 text-white" />
              </div>
            </div>

            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              Go Premium
            </h2>
            <p className="text-[11px] text-white/60 mt-0.5">
              Unlock all features & supercharge your focus
            </p>

            {/* Period Toggle */}
            <div className="flex mt-4 p-1 bg-black/30 rounded-xl border border-white/10">
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide",
                  selectedPeriod === 'monthly'
                    ? "bg-white/15 text-white border border-white/15 shadow-inner"
                    : "text-white/40"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('yearly')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide relative",
                  selectedPeriod === 'yearly'
                    ? "bg-white/15 text-white border border-white/15 shadow-inner"
                    : "text-white/40"
                )}
              >
                Yearly
                <span className="absolute -top-2 -right-0.5 px-1.5 py-0.5 bg-green-500 text-white text-[7px] font-black rounded-full uppercase shadow-lg shadow-green-500/30">
                  Save 33%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="p-3 space-y-3 bg-card">
            {/* Already Premium banner */}
            {isPremium && currentPlan && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">
                    {currentPlan.name} Active
                  </span>
                  <span className="text-[10px] text-green-600/70 dark:text-green-400/60 block">
                    Thank you for supporting NoMo!
                  </span>
                </div>
              </div>
            )}

            {/* Premium Plan */}
            {premiumPlans.map((plan) => renderPlanCard(plan, 'premium'))}

            {/* Premium+ Plan */}
            {premiumPlusPlans.map((plan) => renderPlanCard(plan, 'premium_plus'))}

            {/* Lifetime Plan */}
            {lifetimePlan && renderPlanCard(lifetimePlan, 'lifetime')}

            {/* Restore Purchases */}
            <button
              onClick={handleRestore}
              disabled={isRestoring || isProcessing}
              className={cn(
                "retro-cancel-button w-full py-2.5 flex items-center justify-center gap-2",
                (isRestoring || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRestoring && "animate-spin")} />
              <span className="text-xs font-bold uppercase">
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </span>
            </button>

            {/* Terms */}
            <p className="text-[9px] text-center text-muted-foreground leading-relaxed pb-1">
              Subscriptions auto-renew unless cancelled 24h before period ends. Manage in Apple ID settings.
            </p>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};
