import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type RGB } from "@/lib/color-utils";

interface ColorPaletteProps {
  selectedColorId: string | null;
  onSelectColor: (colorId: string) => void;
  palette: { id: string; color: RGB }[];
}

export function ColorPalette({ selectedColorId, onSelectColor, palette }: ColorPaletteProps) {
  return (
    <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
      <h3 className="text-sm font-bold text-muted-foreground mb-3 font-display uppercase tracking-wider text-center">
        Selected Color to Adjust
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {palette.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectColor(item.id)}
            className="group relative flex items-center justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: selectedColorId === item.id ? 1.2 : 1,
              }}
              className={cn(
                "w-10 h-10 rounded-lg cursor-pointer shadow-sm transition-all",
                "border-2 border-white/50",
                selectedColorId === item.id && "ring-4 ring-primary/20 ring-offset-2 ring-offset-transparent"
              )}
              style={{ backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})` }}
            />
            {selectedColorId === item.id && (
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
