import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, MessageCircle, Shield, FileText, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PixelIcon } from "@/components/ui/PixelIcon";

export const SettingsAbout = () => {
  const navigate = useNavigate();
  const appVersion = "1.0.0";
  const buildDate = new Date().toLocaleDateString();

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {/* App Info - Professional Header */}
      <div className="retro-card overflow-hidden">
        <div
          className="p-6 text-center"
          style={{
            background: 'linear-gradient(180deg, hsl(260 50% 95%) 0%, hsl(260 40% 92%) 50%, hsl(45 60% 94%) 100%)',
            borderBottom: '2px solid hsl(260 30% 85%)',
          }}
        >
          {/* App Icon */}
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, hsl(260 60% 55%) 0%, hsl(280 55% 50%) 100%)',
              border: '3px solid hsl(260 50% 40%)',
              boxShadow: '0 4px 0 hsl(260 50% 35%), 0 8px 16px hsl(260 50% 30% / 0.3), inset 0 2px 0 hsl(260 70% 70% / 0.3)',
            }}
          >
            <PixelIcon name="app-logo" size={48} />
          </div>

          {/* App Name */}
          <h2 className="text-xl font-bold mb-1">NoMo Phone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Put down your phone, grow your island
          </p>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full" style={{
            background: 'hsl(0 0% 100% / 0.7)',
            border: '1px solid hsl(260 20% 85%)',
          }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700">v{appVersion}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-xs text-muted-foreground">{buildDate}</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            🎮 Focus. Collect. Grow. 🌴
          </p>
        </div>
      </div>

      {/* Legal */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold">Legal</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/privacy')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Privacy Policy</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/terms')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <ScrollText className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Terms of Service</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => openLink('mailto:support@nomoinc.co')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Contact Support</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => openLink('https://nomoinc.co')}
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-all active:scale-95 bg-gradient-to-b from-blue-400 to-blue-500 text-white border-2 border-blue-600"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-bold flex-1 text-left">Visit NoMo Inc.</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="retro-stat-pill p-3 text-center">
        <p className="text-[10px] text-muted-foreground">
          &copy; {new Date().getFullYear()} NoMo Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};
