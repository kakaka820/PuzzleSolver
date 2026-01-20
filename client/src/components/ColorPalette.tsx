import { motion } from "framer-motion";
import { COLOR_MAP } from "./Tube";
import { cn } from "@/lib/utils";

interface ColorPaletteProps {
  selectedColor: number | null;
  onSelectColor: (colorId: number) => void;
}

export function ColorPalette({ selectedColor, onSelectColor }: ColorPaletteProps) {
  // Available colors (1-12)
  const colors = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
      <h3 className="text-sm font-bold text-muted-foreground mb-3 font-display uppercase tracking-wider text-center">
        Select Color to Fill
      </h3>
      <div className="grid grid-cols-6 gap-3">
        {colors.map((colorId) => (
          <button
            key={colorId}
            onClick={() => onSelectColor(colorId)}
            className="group relative flex items-center justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: selectedColor === colorId ? 1.2 : 1,
                rotate: selectedColor === colorId ? 180 : 0
              }}
              className={cn(
                "w-10 h-10 rounded-full cursor-pointer shadow-sm transition-all",
                "border-2 border-white/50",
                COLOR_MAP[colorId],
                selectedColor === colorId && "ring-4 ring-primary/20 ring-offset-2 ring-offset-transparent"
              )}
            />
            {selectedColor === colorId && (
              <motion.div 
                layoutId="check"
                className="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow-md"
              >
                ✓
              </motion.div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
