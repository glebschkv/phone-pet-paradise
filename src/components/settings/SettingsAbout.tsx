import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Github, MessageCircle, Star } from "lucide-react";

export const SettingsAbout = () => {
  const appVersion = "1.0.0";
  const buildDate = new Date().toLocaleDateString();

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          About
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Information about Phone Pet Paradise
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phone Pet Paradise</CardTitle>
          <CardDescription>
            A focus timer app that helps you build healthy habits while raising virtual pets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Version {appVersion}</Badge>
            <Badge variant="outline">Built on {buildDate}</Badge>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Transform your productivity journey into an engaging pet-raising adventure. 
              Every focused minute you spend helps your virtual pets grow and unlocks new companions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            What makes Phone Pet Paradise special
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>3D Pet Island:</strong> Watch your pets live and play in a beautiful 3D environment
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Focus Timer:</strong> Pomodoro-style timer to boost your productivity
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Pet Collection:</strong> Unlock new animals as you complete focus sessions
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>XP System:</strong> Level up and earn rewards for your dedication
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community & Support</CardTitle>
          <CardDescription>
            Connect with us and other users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openLink('https://github.com/lovable-dev/phone-pet-paradise')}
          >
            <Github className="w-4 h-4 mr-2" />
            View on GitHub
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openLink('https://discord.gg/lovable')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Join Discord Community
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openLink('https://lovable.dev')}
          >
            <Star className="w-4 h-4 mr-2" />
            Built with Lovable
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Information</CardTitle>
          <CardDescription>
            Framework and technology details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework:</span>
              <span>React + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Styling:</span>
              <span>Tailwind CSS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">3D Engine:</span>
              <span>Three.js + React Three Fiber</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mobile:</span>
              <span>Capacitor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build Tool:</span>
              <span>Vite</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};