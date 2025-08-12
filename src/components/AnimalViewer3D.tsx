import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Animal } from "@/components/Animal";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { AnimalData } from "@/data/AnimalDatabase";
import { X } from "lucide-react";

interface AnimalViewer3DProps {
  animal: AnimalData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnimalViewer3D = ({ animal, isOpen, onClose }: AnimalViewer3DProps) => {
  if (!animal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{animal.emoji}</span>
              {animal.name} - 3D View
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [0, 0.3, 5], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={1.2} color={0xffffff} />
            
            {/* Environment */}
            <Environment preset="studio" />
            
            {/* Animal Model */}
            <Animal
              animalType={animal.name}
              totalPets={1}
              isActive={true}
              index={0}
            />
            
            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />
          </Canvas>
          
          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm text-muted-foreground text-center">
                🖱️ Click and drag to rotate • 🔄 Scroll to zoom • 🤏 Right-click and drag to pan
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};