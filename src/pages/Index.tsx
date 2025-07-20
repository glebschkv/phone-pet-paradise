import { Island3D } from "@/components/Island3D";
import { GameUI } from "@/components/GameUI";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";

const Index = () => {
  const { totalPets } = useAppStateTracking();
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-sky relative">
      {/* 3D Island Scene */}
      <Island3D totalPets={totalPets} isAppActive={true} />
      
      {/* Game UI Overlay */}
      <GameUI />
    </div>
  );
};

export default Index;
