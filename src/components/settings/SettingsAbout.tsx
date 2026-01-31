import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, MessageCircle, Shield, FileText, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SettingsAbout = () => {
  const navigate = useNavigate();
  const appVersion = "1.0.0";
  const buildDate = new Date().toLocaleDateString();

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {/* App Info */}
      <div className="retro-card p-4 overflow-hidden">
        <div className="text-center py-4" style={{
          background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
          margin: '-1rem -1rem 1rem -1rem',
          padding: '1.5rem 1rem'
        }}>
          <div className="text-5xl mb-3">📵</div>
          <h2 className="text-lg font-bold">NoMo Phone</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Put down your phone, grow your island
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="retro-stat-pill text-[10px] font-bold px-2 py-1">
              v{appVersion}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-1">
              {buildDate}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Stay focused, earn rewards, and grow your island.
        </p>
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
            onClick={() => openLink('mailto:suchkov.gleb@icloud.com')}
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
