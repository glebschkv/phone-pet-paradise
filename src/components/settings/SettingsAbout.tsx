import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, MessageCircle, Star, Sparkles, Clock, Grid3X3, Trophy, Shield, FileText, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SettingsAbout = () => {
  const navigate = useNavigate();
  const appVersion = "1.0.0";
  const buildDate = new Date().toLocaleDateString();

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const features = [
    { icon: Sparkles, title: "3D Pet Island", description: "Beautiful 3D environment" },
    { icon: Clock, title: "Focus Timer", description: "Pomodoro-style productivity" },
    { icon: Grid3X3, title: "Pet Collection", description: "Unlock new companions" },
    { icon: Trophy, title: "XP System", description: "Level up and earn rewards" },
  ];

  const techStack = [
    { label: "Framework", value: "React + TypeScript" },
    { label: "Styling", value: "Tailwind CSS" },
    { label: "3D Engine", value: "Three.js" },
    { label: "Mobile", value: "Capacitor" },
  ];

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

      {/* Features */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold">Features</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-3 rounded-lg flex items-start gap-2"
                style={{
                  background: 'hsl(var(--card))',
                  border: '2px solid hsl(var(--border))',
                  boxShadow: '0 2px 0 hsl(var(--border) / 0.4)'
                }}
              >
                <div className="w-8 h-8 retro-stat-pill rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{feature.title}</div>
                  <div className="text-[10px] text-muted-foreground">{feature.description}</div>
                </div>
              </div>
            );
          })}
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
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-all active:scale-95 bg-gradient-to-b from-blue-400 to-blue-500 text-white border-2 border-blue-600"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-bold flex-1 text-left">Visit NoMo Inc.</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">Tech Stack</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {techStack.map((item, index) => (
            <div
              key={index}
              className="p-2 rounded-lg text-center"
              style={{
                background: 'hsl(var(--card))',
                border: '2px solid hsl(var(--border))',
                boxShadow: '0 2px 0 hsl(var(--border) / 0.4)'
              }}
            >
              <div className="text-[10px] text-muted-foreground">{item.label}</div>
              <div className="text-xs font-bold">{item.value}</div>
            </div>
          ))}
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
