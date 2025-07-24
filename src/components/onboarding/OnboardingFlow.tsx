import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Timer, 
  Heart, 
  Trophy, 
  Bell,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Pet Paradise',
      description: 'Build your magical island and care for adorable pets',
      icon: <Heart className="w-8 h-8 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Transform focus time into a thriving pet paradise. The more you focus, the more your island grows!
          </p>
        </div>
      ),
    },
    {
      id: 'timer',
      title: 'Focus Timer',
      description: 'Use our timer to track productive sessions',
      icon: <Timer className="w-8 h-8 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
            <Timer className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-muted-foreground">
            Set focus sessions for 25-90 minutes. Each completed session earns XP to level up and unlock new pets!
          </p>
        </div>
      ),
    },
    {
      id: 'pets',
      title: 'Collect Pets',
      description: 'Unlock adorable creatures as you level up',
      icon: <Trophy className="w-8 h-8 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-green-500" />
          </div>
          <p className="text-muted-foreground">
            Earn XP to level up and unlock foxes, elephants, and more! Each pet brings life to your island.
          </p>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Stay Connected',
      description: 'Enable notifications for the best experience',
      icon: <Bell className="w-8 h-8 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
            <Bell className="w-12 h-12 text-purple-500" />
          </div>
          <p className="text-muted-foreground">
            Get gentle reminders to check on your pets and stay consistent with your focus sessions.
          </p>
        </div>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {currentStep + 1} of {steps.length}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  {steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground">
                  {steps[currentStep].description}
                </p>
              </div>

              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};