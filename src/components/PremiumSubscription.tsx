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
  Infinity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePremiumStatus, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/hooks/usePremiumStatus';
import { useStoreKit } from '@/hooks/useStoreKit';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PremiumSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  // Multipliers
  '2x Coin & XP multiplier': <Zap className="w-4 h-4" />,
  '3x Coin & XP multiplier': <Zap className="w-4 h-4" />,
  '4x Coin & XP multiplier': <Zap className="w-4 h-4" />,
  // Sounds
  'All 13 ambient sounds': <Volume2 className="w-4 h-4" />,
  // Timer
  'Auto-break Pomodoro cycles': <Timer className="w-4 h-4" />,
  'Session notes & reflections': <PenLine className="w-4 h-4" />,
  'Focus analytics dashboard': <BarChart3 className="w-4 h-4" />,
  // Streak freezes
  '2 Streak Freezes/month': <Snowflake className="w-4 h-4" />,
  '5 Streak Freezes/month': <Snowflake className="w-4 h-4" />,
  '7 Streak Freezes/month': <Snowflake className="w-4 h-4" />,
  // Sound mixing
  'Sound mixing (2 layers)': <Music className="w-4 h-4" />,
  'Sound mixing (3 layers)': <Music className="w-4 h-4" />,
  // Presets
  '3 Focus presets': <Settings className="w-4 h-4" />,
  '5 Focus presets': <Settings className="w-4 h-4" />,
  '10 Focus presets': <Settings className="w-4 h-4" />,
  // Premium+
  'Everything in Premium': <Check className="w-4 h-4" />,
  'Everything in Premium+': <Check className="w-4 h-4" />,
  'Battle Pass Premium included': <Award className="w-4 h-4" />,
  'Early access to features': <Zap className="w-4 h-4" />,
  'Exclusive profile frames': <Star className="w-4 h-4" />,
  // Lifetime
  'No recurring fees ever': <Infinity className="w-4 h-4" />,
  'All future updates included': <RefreshCw className="w-4 h-4" />,
  'Exclusive Founder badge': <Star className="w-4 h-4" />,
  'Founder-only legendary pet': <Sparkles className="w-4 h-4" />,
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
      // Use real StoreKit
      const result = await storeKit.purchaseProduct(plan.iapProductId);
      setIsProcessing(false);

      if (result.success) {
        // Grant bonus coins
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
      // Fallback for web/dev
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = purchaseSubscription(plan.id);
      setIsProcessing(false);

      if (result.success) {
        // Grant bonus coins for dev testing
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
      // Use real StoreKit
      await storeKit.restorePurchases();
      setIsRestoring(false);
      // Toast is handled by useStoreKit
    } else {
      // Fallback for web/dev
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

  // Filter plans by selected period
  const premiumPlans = SUBSCRIPTION_PLANS.filter(
    p => p.tier === 'premium' && p.period === selectedPeriod
  );
  const premiumPlusPlans = SUBSCRIPTION_PLANS.filter(
    p => p.tier === 'premium_plus' && p.period === selectedPeriod
  );
  const lifetimePlan = SUBSCRIPTION_PLANS.find(p => p.period === 'lifetime');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <Crown className="w-7 h-7" />
              Go Premium
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/90 mt-2">
            Unlock all features and supercharge your focus
          </p>

          {/* Period Toggle */}
          <div className="flex gap-2 mt-4 p-1 bg-white/20 rounded-xl">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedPeriod === 'monthly'
                  ? "bg-white text-amber-600"
                  : "text-white/80 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all relative",
                selectedPeriod === 'yearly'
                  ? "bg-white text-amber-600"
                  : "text-white/80 hover:text-white"
              )}
            >
              Yearly
              <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                SAVE 37%
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Already Premium */}
          {isPremium && currentPlan && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-bold text-green-700 dark:text-green-400">
                  You're a {currentPlan.name} member!
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300">
                Thank you for supporting Pet Paradise!
              </p>
            </div>
          )}

          {/* Premium Plan */}
          {premiumPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-xl border-2 overflow-hidden transition-all",
                plan.isPopular
                  ? "border-amber-400 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30"
                  : "border-gray-200 dark:border-gray-700"
              )}
            >
              {plan.isPopular && (
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center py-1 text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-600">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">
                      /{plan.period === 'monthly' ? 'mo' : 'year'}
                    </p>
                  </div>
                </div>

                {/* Bonus coins badge */}
                {plan.bonusCoins > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg w-fit">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      +{plan.bonusCoins.toLocaleString()} bonus coins!
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="text-amber-500">
                        {FEATURE_ICONS[feature] || <Check className="w-4 h-4" />}
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isProcessing || (isPremium && tier === 'premium')}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all",
                    isPremium && tier === 'premium'
                      ? "bg-gray-200 dark:bg-gray-700 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-md hover:from-amber-500 hover:to-amber-600"
                  )}
                >
                  {isProcessing ? 'Processing...' : isPremium && tier === 'premium' ? 'Current Plan' : 'Subscribe'}
                </button>
              </div>
            </div>
          ))}

          {/* Premium+ Plan */}
          {premiumPlusPlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border-2 border-purple-300 dark:border-purple-700 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-purple-600">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">
                      /{plan.period === 'monthly' ? 'mo' : 'year'}
                    </p>
                  </div>
                </div>

                {/* Bonus coins badge */}
                {plan.bonusCoins > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit">
                    <Coins className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                      +{plan.bonusCoins.toLocaleString()} bonus coins!
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="text-purple-500">
                        {FEATURE_ICONS[feature] || <Check className="w-4 h-4" />}
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isProcessing || tier === 'premium_plus' || isLifetime}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all",
                    (tier === 'premium_plus' || isLifetime)
                      ? "bg-gray-200 dark:bg-gray-700 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-b from-purple-500 to-pink-500 text-white shadow-md hover:from-purple-600 hover:to-pink-600"
                  )}
                >
                  {isProcessing ? 'Processing...' : (tier === 'premium_plus' || isLifetime) ? 'Current Plan' : 'Upgrade to Premium+'}
                </button>
              </div>
            </div>
          ))}

          {/* Lifetime Plan */}
          {lifetimePlan && (
            <div className="rounded-xl border-2 border-amber-400 overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20">
              <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white text-center py-1.5 text-xs font-bold flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" />
                BEST VALUE - LIFETIME ACCESS
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{lifetimePlan.name}</h3>
                    <p className="text-xs text-muted-foreground">{lifetimePlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {lifetimePlan.price}
                    </p>
                    <p className="text-xs text-muted-foreground">one-time</p>
                  </div>
                </div>

                {/* Bonus coins badge */}
                {lifetimePlan.bonusCoins > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg w-fit">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                      +{lifetimePlan.bonusCoins.toLocaleString()} bonus coins!
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {lifetimePlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="text-amber-500">
                        {FEATURE_ICONS[feature] || <Check className="w-4 h-4" />}
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(lifetimePlan)}
                  disabled={isProcessing || isLifetime}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all",
                    isLifetime
                      ? "bg-gray-200 dark:bg-gray-700 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-b from-amber-500 via-yellow-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600"
                  )}
                >
                  {isProcessing ? 'Processing...' : isLifetime ? 'Lifetime Member' : 'Get Lifetime Access'}
                </button>
              </div>
            </div>
          )}

          {/* Restore Purchases - Made prominent per Apple guidelines */}
          <div className="border-t pt-4 mt-2">
            <button
              onClick={handleRestore}
              disabled={isRestoring || isProcessing}
              className="w-full py-3 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRestoring && "animate-spin")} />
              {isRestoring ? 'Restoring...' : 'Restore Previous Purchases'}
            </button>
          </div>

          {/* Terms */}
          <p className="text-[10px] text-center text-muted-foreground">
            Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
            Manage subscriptions in your Apple ID account settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
