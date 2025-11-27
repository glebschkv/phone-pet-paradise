import { Users, Sparkles, Heart, MessageCircle, Trophy } from "lucide-react";

export const FriendsComingSoon = () => {
  return (
    <div className="min-h-screen pb-24" style={{
      background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
    }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 retro-level-badge rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Friends</h1>
            <p className="text-xs text-muted-foreground">Connect with others</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="px-3 pt-4">
        <div className="retro-card p-6 text-center">
          {/* Decorative Icon */}
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 retro-stat-pill rounded-full flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 retro-level-badge rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We're working hard to bring you an awesome social experience!
          </p>

          {/* Preview Features */}
          <div className="space-y-3">
            <div className="retro-stat-pill p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Add Friends</div>
                <div className="text-xs text-muted-foreground">Connect with fellow pet lovers</div>
              </div>
            </div>

            <div className="retro-stat-pill p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Share Progress</div>
                <div className="text-xs text-muted-foreground">Show off your focus streaks</div>
              </div>
            </div>

            <div className="retro-stat-pill p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Leaderboards</div>
                <div className="text-xs text-muted-foreground">Compete with your friends</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Tuned Message */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};
