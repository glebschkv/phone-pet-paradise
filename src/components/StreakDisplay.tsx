import {
  Flame,
  Calendar,
  Snowflake,
  Trophy
} from 'lucide-react';
import { useAppStateTracking } from '@/hooks/useAppStateTracking';
import { PixelIcon } from '@/components/ui/PixelIcon';

export const StreakDisplay = () => {
  const { streakData, getNextMilestone, getStreakIcon } = useAppStateTracking();

  const nextMilestone = getNextMilestone();
  const progressToNext = nextMilestone
    ? (streakData.currentStreak / nextMilestone.milestone) * 100
    : 100;
  const hasActiveStreak = streakData.currentStreak >= 3;

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(35 45% 94%) 0%, hsl(32 40% 89%) 100%)',
        border: '2px solid hsl(30 35% 65%)',
        boxShadow: 'inset 0 1px 0 hsl(40 50% 97%), 0 4px 12px hsl(30 40% 20% / 0.15)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame
              className="w-5 h-5 text-orange-500"
              style={hasActiveStreak ? { filter: 'drop-shadow(0 0 4px hsl(25 100% 50% / 0.6))' } : undefined}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(30 50% 25%)' }}>Focus Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <PixelIcon name={getStreakIcon(streakData.currentStreak)} size={28} />
            <div
              className="retro-level-badge px-3 py-1 text-lg"
              style={hasActiveStreak ? { boxShadow: '0 2px 0 hsl(30 70% 30%), 0 0 10px hsl(25 100% 50% / 0.3)' } : undefined}
            >
              {streakData.currentStreak}
            </div>
          </div>
        </div>

        {/* Next milestone progress */}
        {nextMilestone && (
          <div className="mb-3">
            <div className="flex justify-between mb-1.5" style={{ fontSize: 12 }}>
              <span style={{ color: 'hsl(30 30% 40%)', fontWeight: 600 }}>Next milestone</span>
              <span style={{ color: 'hsl(30 50% 25%)', fontWeight: 700 }}>{nextMilestone.title}</span>
            </div>
            <div
              style={{
                height: 10,
                background: 'hsl(30 25% 75%)',
                border: '2px solid hsl(30 30% 65%)',
                borderRadius: 5,
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 3px hsl(30 20% 60% / 0.4)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, progressToNext)}%`,
                  background: 'linear-gradient(90deg, hsl(25 90% 50%), hsl(15 85% 45%))',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                  boxShadow: '0 0 6px hsl(25 100% 50% / 0.4)',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'hsl(30 30% 45%)', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>
              {streakData.currentStreak} / {nextMilestone.milestone} days
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="text-center py-2 px-1 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, hsl(35 35% 88%) 0%, hsl(32 30% 84%) 100%)',
              border: '1.5px solid hsl(30 30% 75%)',
              boxShadow: 'inset 0 1px 0 hsl(40 40% 95%), 0 1px 0 hsl(30 25% 70% / 0.3)',
            }}
          >
            <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" style={{ filter: 'drop-shadow(0 0 2px hsl(45 100% 50% / 0.5))' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(30 50% 22%)' }}>{streakData.longestStreak}</div>
            <div style={{ fontSize: 10, color: 'hsl(30 30% 45%)', fontWeight: 600 }}>Best</div>
          </div>

          <div
            className="text-center py-2 px-1 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, hsl(35 35% 88%) 0%, hsl(32 30% 84%) 100%)',
              border: '1.5px solid hsl(30 30% 75%)',
              boxShadow: 'inset 0 1px 0 hsl(40 40% 95%), 0 1px 0 hsl(30 25% 70% / 0.3)',
            }}
          >
            <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" style={{ filter: 'drop-shadow(0 0 2px hsl(210 100% 50% / 0.4))' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(30 50% 22%)' }}>{streakData.totalSessions}</div>
            <div style={{ fontSize: 10, color: 'hsl(30 30% 45%)', fontWeight: 600 }}>Total</div>
          </div>

          <div
            className="text-center py-2 px-1 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, hsl(35 35% 88%) 0%, hsl(32 30% 84%) 100%)',
              border: '1.5px solid hsl(30 30% 75%)',
              boxShadow: 'inset 0 1px 0 hsl(40 40% 95%), 0 1px 0 hsl(30 25% 70% / 0.3)',
            }}
          >
            <Snowflake className="w-4 h-4 text-cyan-500 mx-auto mb-1" style={{ filter: 'drop-shadow(0 0 2px hsl(190 100% 50% / 0.4))' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'hsl(30 50% 22%)' }}>{streakData.streakFreezeCount}</div>
            <div style={{ fontSize: 10, color: 'hsl(30 30% 45%)', fontWeight: 600 }}>Freezes</div>
          </div>
        </div>
      </div>
    </div>
  );
};
