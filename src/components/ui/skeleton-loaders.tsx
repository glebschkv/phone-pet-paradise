/**
 * Skeleton Loaders
 *
 * Loading skeleton components for better perceived performance.
 * Shows content structure while data is loading.
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// PET COLLECTION SKELETONS
// ============================================================================

export const PetCardSkeleton = memo(() => (
  <div className="retro-card p-2 space-y-2">
    <Skeleton className="aspect-square rounded-lg" />
    <div className="space-y-1">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  </div>
));

PetCardSkeleton.displayName = 'PetCardSkeleton';

export const PetGridSkeleton = memo(({ count = 9 }: { count?: number }) => (
  <div className="grid grid-cols-3 gap-2 p-3">
    {Array.from({ length: count }).map((_, i) => (
      <PetCardSkeleton key={i} />
    ))}
  </div>
));

PetGridSkeleton.displayName = 'PetGridSkeleton';

// ============================================================================
// SHOP SKELETONS
// ============================================================================

export const ShopItemSkeleton = memo(() => (
  <div className="retro-card p-3 space-y-2">
    <Skeleton className="h-20 rounded-lg" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
));

ShopItemSkeleton.displayName = 'ShopItemSkeleton';

export const ShopGridSkeleton = memo(({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3 p-3">
    {Array.from({ length: count }).map((_, i) => (
      <ShopItemSkeleton key={i} />
    ))}
  </div>
));

ShopGridSkeleton.displayName = 'ShopGridSkeleton';

// ============================================================================
// STATS & PROGRESS SKELETONS
// ============================================================================

export const StatBarSkeleton = memo(() => (
  <div className="flex items-center gap-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-2 w-full" />
    </div>
  </div>
));

StatBarSkeleton.displayName = 'StatBarSkeleton';

export const LevelProgressSkeleton = memo(() => (
  <div className="space-y-2 p-3">
    <div className="flex justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-3 w-full rounded-full" />
  </div>
));

LevelProgressSkeleton.displayName = 'LevelProgressSkeleton';

// ============================================================================
// ACHIEVEMENT SKELETONS
// ============================================================================

export const AchievementCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 p-3 retro-card">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  </div>
));

AchievementCardSkeleton.displayName = 'AchievementCardSkeleton';

export const AchievementGridSkeleton = memo(({ count = 4 }: { count?: number }) => (
  <div className="space-y-2 p-3">
    {Array.from({ length: count }).map((_, i) => (
      <AchievementCardSkeleton key={i} />
    ))}
  </div>
));

AchievementGridSkeleton.displayName = 'AchievementGridSkeleton';

// ============================================================================
// QUEST SKELETONS
// ============================================================================

export const QuestCardSkeleton = memo(() => (
  <div className="retro-card p-3 space-y-2">
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <Skeleton className="h-3 w-full" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-2 flex-1 rounded-full" />
      <Skeleton className="h-3 w-10" />
    </div>
  </div>
));

QuestCardSkeleton.displayName = 'QuestCardSkeleton';

// ============================================================================
// TIMER SKELETONS
// ============================================================================

export const TimerDisplaySkeleton = memo(() => (
  <div className="flex flex-col items-center justify-center p-6 space-y-4">
    <Skeleton className="h-40 w-40 rounded-full" />
    <Skeleton className="h-6 w-32" />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-lg" />
    </div>
  </div>
));

TimerDisplaySkeleton.displayName = 'TimerDisplaySkeleton';

export const DurationSelectorSkeleton = memo(() => (
  <div className="flex gap-2 overflow-x-auto p-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-16 rounded-lg flex-shrink-0" />
    ))}
  </div>
));

DurationSelectorSkeleton.displayName = 'DurationSelectorSkeleton';

// ============================================================================
// WORLD/BIOME SKELETONS
// ============================================================================

export const WorldCardSkeleton = memo(() => (
  <div className="retro-card overflow-hidden">
    <div className="flex items-stretch">
      <Skeleton className="w-20 h-16 flex-shrink-0" />
      <div className="flex-1 flex items-center justify-between px-3 py-2">
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-12 rounded" />
      </div>
    </div>
  </div>
));

WorldCardSkeleton.displayName = 'WorldCardSkeleton';

export const WorldGridSkeleton = memo(({ count = 4 }: { count?: number }) => (
  <div className="space-y-2 p-3">
    {Array.from({ length: count }).map((_, i) => (
      <WorldCardSkeleton key={i} />
    ))}
  </div>
));

WorldGridSkeleton.displayName = 'WorldGridSkeleton';

// ============================================================================
// SETTINGS SKELETONS
// ============================================================================

export const SettingsRowSkeleton = memo(() => (
  <div className="flex items-center justify-between p-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-6 w-12 rounded-full" />
  </div>
));

SettingsRowSkeleton.displayName = 'SettingsRowSkeleton';

export const SettingsSectionSkeleton = memo(({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-1">
    <Skeleton className="h-3 w-24 mb-2" />
    {Array.from({ length: rows }).map((_, i) => (
      <SettingsRowSkeleton key={i} />
    ))}
  </div>
));

SettingsSectionSkeleton.displayName = 'SettingsSectionSkeleton';

// ============================================================================
// PAGE SKELETONS
// ============================================================================

interface PageSkeletonProps {
  className?: string;
}

export const HomePageSkeleton = memo(({ className }: PageSkeletonProps) => (
  <div className={cn('flex flex-col h-full', className)}>
    {/* Top status bar */}
    <div className="flex items-center justify-between p-3 border-b">
      <StatBarSkeleton />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>

    {/* Main content area */}
    <div className="flex-1 flex items-center justify-center p-6">
      <Skeleton className="h-48 w-48 rounded-full" />
    </div>

    {/* Bottom action area */}
    <div className="p-4 space-y-3">
      <LevelProgressSkeleton />
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  </div>
));

HomePageSkeleton.displayName = 'HomePageSkeleton';

export const CollectionPageSkeleton = memo(({ className }: PageSkeletonProps) => (
  <div className={cn('flex flex-col h-full', className)}>
    {/* Header with tabs */}
    <div className="p-3 border-b space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>

    {/* Grid content */}
    <PetGridSkeleton count={12} />
  </div>
));

CollectionPageSkeleton.displayName = 'CollectionPageSkeleton';

export const ShopPageSkeleton = memo(({ className }: PageSkeletonProps) => (
  <div className={cn('flex flex-col h-full', className)}>
    {/* Header with balance */}
    <div className="flex items-center justify-between p-3 border-b">
      <Skeleton className="h-6 w-24" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>

    {/* Category tabs */}
    <div className="flex gap-2 p-3 overflow-x-auto">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
      ))}
    </div>

    {/* Grid content */}
    <ShopGridSkeleton count={6} />
  </div>
));

ShopPageSkeleton.displayName = 'ShopPageSkeleton';

// ============================================================================
// MODAL SKELETONS
// ============================================================================

export const ModalContentSkeleton = memo(() => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-32 w-full rounded-lg" />
    <Skeleton className="h-6 w-3/4 mx-auto" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 flex-1 rounded-lg" />
    </div>
  </div>
));

ModalContentSkeleton.displayName = 'ModalContentSkeleton';
