import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Github, MessageCircle, Star, Sparkles, Clock, Grid3X3, Trophy } from "lucide-react";

export const SettingsAbout = () => {
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
          <div className="text-5xl mb-3">🐾</div>
          <h2 className="text-lg font-bold">Phone Pet Paradise</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Focus timer with virtual pet companions
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
          Transform your productivity journey into an engaging pet-raising adventure.
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

      {/* Community Links */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold">Community</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => openLink('https://github.com/lovable-dev/phone-pet-paradise')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">View on GitHub</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => openLink('https://discord.gg/lovable')}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold flex-1 text-left">Join Discord</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => openLink('https://lovable.dev')}
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-all active:scale-95 bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-2 border-amber-500"
          >
            <Star className="w-5 h-5" />
            <span className="text-sm font-bold flex-1 text-left">Built with Lovable</span>
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
          Made with love for productivity enthusiasts
        </p>
      </div>
    </div>
  );
};
