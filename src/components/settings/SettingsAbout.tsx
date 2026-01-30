import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, MessageCircle, Shield, FileText, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SettingsAbout = () => {
  const navigate = useNavigate();
  const appVersion = "1.0.0";

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {/* App Info */}
      <div className="retro-card p-0 overflow-hidden">
        <div className="text-center px-4 pt-6 pb-4" style={{
          background: 'linear-gradient(180deg, hsl(45 80% 85%) 0%, hsl(35 60% 88%) 60%, hsl(var(--card)) 100%)',
        }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{
              background: 'linear-gradient(145deg, hsl(260 55% 58%) 0%, hsl(260 50% 45%) 100%)',
              border: '3px solid hsl(260 45% 38%)',
              boxShadow: '0 4px 0 hsl(260 45% 30%), inset 0 2px 0 hsl(260 60% 75% / 0.4)',
            }}
          >
            <span className="text-3xl">📵</span>
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight">NoMo Phone</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Put down your phone, grow your island
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="text-[10px] font-bold px-2.5 py-1 rounded-md"
              style={{
                background: 'linear-gradient(180deg, hsl(45 90% 65%) 0%, hsl(35 85% 52%) 100%)',
                border: '2px solid hsl(30 80% 45%)',
                color: 'hsl(30 60% 15%)',
                boxShadow: '0 2px 0 hsl(30 80% 38%), inset 0 1px 0 hsl(50 100% 85% / 0.5)',
              }}
            >
              v{appVersion}
            </Badge>
          </div>
        </div>
        <div className="px-4 py-3 text-center" style={{
          borderTop: '2px solid hsl(var(--border) / 0.3)',
        }}>
          <p className="text-xs text-muted-foreground font-medium">
            Stay focused, earn rewards, and grow your island.
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
            onClick={() => openLink('mailto:suchkov.gleb@icloud.com')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Contact Support</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => openLink('https://nomoinc.co')}
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-all active:scale-95"
            style={{
              background: 'linear-gradient(180deg, hsl(210 70% 55%) 0%, hsl(210 65% 45%) 100%)',
              border: '2px solid hsl(210 60% 38%)',
              color: 'white',
              boxShadow: '0 3px 0 hsl(210 60% 30%), inset 0 1px 0 hsl(210 80% 70% / 0.4)',
            }}
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
