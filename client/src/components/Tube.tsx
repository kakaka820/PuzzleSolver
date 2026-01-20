import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Map internal color IDs to CSS variables or Tailwind colors
export const COLOR_MAP: Record<number, string> = {
  1: "bg-red-500 shadow-red-500/50",
  2: "bg-blue-500 shadow-blue-500/50",
  3: "bg-green-500 shadow-green-500/50",
  4: "bg-yellow-400 shadow-yellow-400/50",
  5: "bg-purple-500 shadow-purple-500/50",
  6: "bg-orange-500 shadow-orange-500/50",
  7: "bg-pink-500 shadow-pink-500/50",
  8: "bg-cyan-400 shadow-cyan-400/50",
  9: "bg-lime-500 shadow-lime-500/50",
  10: "bg-indigo-500 shadow-indigo-500/50",
  11: "bg-teal-500 shadow-teal-500/50",
  12: "bg-gray-500 shadow-gray-500/50", // Use as 'stone' or neutral
};

interface TubeProps {
  id: number;
  colors: number[];
  isSelected?: boolean;
  isTarget?: boolean;
  onClick?: () => void;
  maxCapacity?: number;
}

export function Tube({ 
  id, 
  colors, 
  isSelected, 
  isTarget, 
  onClick, 
  maxCapacity = 4 
}: TubeProps) {
  
  // Create slots including empty ones for spacing
  const slots = Array.from({ length: maxCapacity }).map((_, i) => {
    // Colors are stacked bottom-up in data (index 0 is bottom), 
    // but visually we render top-down in flex column usually? 
    // Actually, physically a tube fills from bottom. 
    // Let's render flex-col-reverse.
    return colors[i] || null;
  });

  return (
    <div className="flex flex-col items-center gap-2 group">
      {/* Selection Indicator */}
      <motion.div 
        initial={false}
        animate={{ 
          y: isSelected ? 0 : 10, 
          opacity: isSelected ? 1 : 0 
        }}
        className="text-primary font-display font-bold text-lg"
      >
        ▼
      </motion.div>

      <motion.div
        layout
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          scale: isSelected ? 1.05 : 1,
          borderColor: isSelected 
            ? "var(--primary)" 
            : isTarget 
              ? "var(--secondary)" 
              : "rgba(255,255,255,0.5)",
          boxShadow: isSelected 
            ? "0 0 20px var(--primary)" 
            : isTarget
              ? "0 0 20px var(--secondary)"
              : "0 4px 12px rgba(0,0,0,0.1)"
        }}
        className={cn(
          "relative w-16 h-48 rounded-b-3xl rounded-t-lg border-4 border-white/50",
          "cursor-pointer flex flex-col-reverse p-1 gap-1 overflow-hidden",
          "transition-colors duration-200",
          "tube-glass" // Custom CSS class for glass effect
        )}
      >
        <AnimatePresence mode="popLayout">
          {colors.map((colorId, index) => (
            <motion.div
              key={`${id}-ball-${index}-${colorId}`}
              layoutId={isSelected && index === colors.length - 1 ? "selected-ball" : undefined}
              initial={{ y: -50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-full aspect-square rounded-full shadow-inner",
                "border border-white/20 backdrop-brightness-110",
                COLOR_MAP[colorId] || "bg-gray-300"
              )}
            />
          ))}
        </AnimatePresence>
      </motion.div>
      
      {/* Tube Number */}
      <span className="text-muted-foreground font-display font-semibold text-sm">
        #{id + 1}
      </span>
    </div>
  );
}
