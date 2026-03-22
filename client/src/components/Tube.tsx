import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TubeProps {
  id: number;
  colors: string[];
  palette?: { id: string; color: { r: number; g: number; b: number } }[];
  isSelected?: boolean;
  isTarget?: boolean;
  onClick?: () => void;
  maxCapacity?: number;
}

export function Tube({
  id,
  colors,
  palette = [],
  isSelected,
  isTarget,
  onClick,
  maxCapacity = 4
}: TubeProps) {

  const getColorStyle = (colorId: string): React.CSSProperties => {
    const entry = palette.find(p => p.id === colorId);
    if (entry?.color) {
      const { r, g, b } = entry.color;
      return { backgroundColor: `rgb(${r}, ${g}, ${b})` };
    }
    return { backgroundColor: "#9ca3af" };
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col-reverse items-center justify-start gap-1 cursor-pointer",
        "w-16 min-h-[180px] rounded-b-[40px] rounded-t-xl",
        "border-2 border-gray-200 bg-white/50 backdrop-blur-sm",
        "shadow-inner transition-all duration-200",
        isSelected && "border-primary shadow-primary/30 shadow-lg scale-105",
        isTarget && "border-green-400 shadow-green-400/30 shadow-lg"
      )}
    >
      <div className={cn(
        "absolute -top-6 left-1/2 -translate-x-1/2 text-primary text-lg transition-opacity",
        isSelected ? "opacity-100" : "opacity-0"
      )}>▼</div>

      {colors.map((colorId, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-10 h-10 rounded-full shadow-md"
          style={getColorStyle(colorId)}
        />
      ))}

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
        #{id + 1}
      </div>
    </div>
  );
}