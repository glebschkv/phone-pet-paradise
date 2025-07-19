import { Island3D } from "@/components/Island3D";
import { GameUI } from "@/components/GameUI";

const Index = () => {
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-sky relative">
      {/* 3D Island Scene */}
      <Island3D />
      
      {/* Game UI Overlay */}
      <GameUI />
    </div>
  );
};

export default Index;
