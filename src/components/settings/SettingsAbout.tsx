import { Heart, ExternalLink, MessageCircle, Shield, FileText, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SettingsAbout = () => {
  const navigate = useNavigate();
  const appVersion = "1.0.0";

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* App Info - Hero */}
      <div className="retro-game-card overflow-hidden">
        <div className="relative p-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-transparent to-pink-900/30" />
          <div className="relative">
            {/* App Icon */}
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, hsl(260 60% 55%) 0%, hsl(280 55% 50%) 100%)',
                border: '3px solid hsl(260 50% 40%)',
                boxShadow: '0 4px 0 hsl(260 50% 35%), 0 8px 16px hsl(260 50% 30% / 0.3), inset 0 2px 0 hsl(260 70% 70% / 0.3)',
              }}
            >
              <img src="/app-icon.png" alt="NoMo Phone" width={48} height={48} className="rounded-lg" draggable={false} />
            </div>

            {/* App Name */}
            <h2 className="text-xl font-bold retro-pixel-text retro-neon-text mb-1">NoMo Phone</h2>
            <p className="text-sm text-purple-300/80 mb-4">
              Put down your phone, grow your island
            </p>

            {/* Version Badge */}
            <div className="inline-flex items-center gap-3 retro-stat-pill px-4 py-2 rounded-full">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-400">v{appVersion}</span>
              </div>
              <div className="w-px h-4 bg-purple-600/50" />
              <span className="text-xs text-purple-300/70">Live</span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="p-4 text-center border-t border-purple-600/30">
          <p className="text-sm text-purple-300/80">
            Focus. Collect. Grow.
          </p>
        </div>
      </div>

      {/* Legal */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">LEGAL</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/privacy')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95 text-purple-100"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Privacy Policy</span>
            <ExternalLink className="w-4 h-4 text-purple-300/60" />
          </button>

          <button
            onClick={() => navigate('/terms')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95 text-purple-100"
          >
            <ScrollText className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Terms of Service</span>
            <ExternalLink className="w-4 h-4 text-purple-300/60" />
          </button>

          <button
            onClick={() => openLink('mailto:support@nomoinc.co')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95 text-purple-100"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Contact Support</span>
            <ExternalLink className="w-4 h-4 text-purple-300/60" />
          </button>

          <button
            onClick={() => openLink('https://nomoinc.co')}
            className="w-full retro-arcade-btn retro-arcade-btn-green px-3 py-2.5 text-sm flex items-center gap-3"
          >
            <Heart className="w-5 h-5" />
            <span className="font-bold flex-1 text-left">Visit NoMo Inc.</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="retro-stat-pill p-3 text-center">
        <p className="text-[11px] text-purple-300/60">
          &copy; {new Date().getFullYear()} NoMo Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};
