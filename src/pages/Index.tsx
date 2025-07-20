import { Island3D } from "@/components/Island3D";
import { GameUI } from "@/components/GameUI";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { NomoTrackingTest } from "@/components/NomoTrackingTest";

const Index = () => {
  const { totalPets } = useAppStateTracking();
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-sky relative">
      {/* Test Component - Remove after testing */}
      <div className="absolute top-0 left-0 z-50 max-w-sm">
        <NomoTrackingTest />
      </div>
      
      {/* 3D Island Scene */}
      <Island3D totalPets={totalPets} isAppActive={true} />
      
      {/* Game UI Overlay */}
      <GameUI />
    </div>
  );
};

export default Index;
