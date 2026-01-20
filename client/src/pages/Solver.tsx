import { useState, useEffect } from "react";
import { Tube } from "@/components/Tube";
import { ColorPalette } from "@/components/ColorPalette";
import { Controls } from "@/components/Controls";
import { useSolvePuzzle, type Tube as TubeType } from "@/hooks/use-solver";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";

// Initial state: 4 tubes, empty
const INITIAL_TUBES = [[], [], [], []];
const MAX_CAPACITY = 4;

export default function Solver() {
  const [tubes, setTubes] = useState<TubeType[]>(INITIAL_TUBES);
  const [selectedColor, setSelectedColor] = useState<number | null>(1);
  const [solutionMode, setSolutionMode] = useState(false);
  const [solutionMoves, setSolutionMoves] = useState<{from: number, to: number}[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [originalState, setOriginalState] = useState<TubeType[]>([]);

  const { toast } = useToast();
  const solveMutation = useSolvePuzzle();

  // Reset to edit mode
  const handleReset = () => {
    if (solutionMode) {
      setTubes(originalState);
      setSolutionMode(false);
      setSolutionMoves([]);
      setCurrentStep(0);
    } else {
      // Just clear selection if in edit mode
      // Or maybe reset to default tubes?
      // Let's reset to default tubes if clicked "Reset" in edit mode
    }
  };

  const handleClear = () => {
    setTubes(tubes.map(() => []));
    toast({ description: "Board cleared" });
  };

  const handleAddTube = () => {
    if (tubes.length >= 12) {
      toast({ variant: "destructive", description: "Max 12 tubes allowed" });
      return;
    }
    setTubes([...tubes, []]);
  };

  const handleRemoveTube = () => {
    if (tubes.length <= 2) {
      toast({ variant: "destructive", description: "Min 2 tubes required" });
      return;
    }
    setTubes(tubes.slice(0, -1));
  };

  const handleTubeClick = (tubeIndex: number) => {
    if (solutionMode) return;

    if (selectedColor === null) {
      // Logic for moving pieces manually (not implemented for "Solver" mode per se, 
      // but users might want to play). For now, let's stick to "Setup" mode.
      // Setup mode: Click adds selected color to tube.
      toast({ description: "Select a color from the palette first" });
      return;
    }

    setTubes(prev => {
      const newTubes = [...prev];
      const tube = [...newTubes[tubeIndex]];

      if (tube.length >= MAX_CAPACITY) {
        // If full, maybe remove the top one?
        // Or show error? Let's remove top one to make editing easier
        tube.pop();
      } else {
        tube.push(selectedColor);
      }
      
      newTubes[tubeIndex] = tube;
      return newTubes;
    });
  };

  const handleRightClickTube = (e: React.MouseEvent, tubeIndex: number) => {
    e.preventDefault();
    if (solutionMode) return;
    
    // Remove top color
    setTubes(prev => {
      const newTubes = [...prev];
      const tube = [...newTubes[tubeIndex]];
      if (tube.length > 0) {
        tube.pop();
        newTubes[tubeIndex] = tube;
      }
      return newTubes;
    });
  };

  const handleSolve = async () => {
    // Basic validation
    const totalColors: Record<number, number> = {};
    let hasEmpty = false;
    
    tubes.forEach(tube => {
      if (tube.length === 0) hasEmpty = true;
      tube.forEach(c => {
        totalColors[c] = (totalColors[c] || 0) + 1;
      });
    });

    // Check if colors are divisible by capacity (usually 4)
    // Actually, solver backend will handle validation logic mostly.
    // Frontend just checks trivial things.
    if (Object.keys(totalColors).length === 0) {
      toast({ variant: "destructive", description: "Add some colors first!" });
      return;
    }

    try {
      const result = await solveMutation.mutateAsync(tubes);
      
      if (!result.solvable) {
        toast({ 
          variant: "destructive", 
          title: "Unsolvable!", 
          description: result.error || "This configuration has no solution." 
        });
        return;
      }

      setOriginalState(JSON.parse(JSON.stringify(tubes))); // Deep copy
      setSolutionMoves(result.moves);
      setSolutionMode(true);
      setCurrentStep(0);
      
      toast({ 
        title: "Solved!", 
        description: `Solution found in ${result.moves.length} steps.`,
        className: "bg-green-500 text-white border-green-600"
      });

    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: err.message 
      });
    }
  };

  const applyMove = (moveIndex: number, direction: 'forward' | 'backward') => {
    setTubes(prev => {
      const nextTubes = prev.map(t => [...t]); // Deep copy outer
      const move = solutionMoves[moveIndex]; // { from, to }

      if (direction === 'forward') {
        const color = nextTubes[move.from].pop();
        if (color !== undefined) {
          nextTubes[move.to].push(color);
        }
      } else {
        // Reverse the move: take from 'to' and put back to 'from'
        const color = nextTubes[move.to].pop();
        if (color !== undefined) {
          nextTubes[move.from].push(color);
        }
      }
      return nextTubes;
    });
  };

  const handleNextStep = () => {
    if (currentStep < solutionMoves.length) {
      applyMove(currentStep, 'forward');
      setCurrentStep(c => c + 1);
      
      // Check if finished
      if (currentStep + 1 === solutionMoves.length) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      applyMove(currentStep - 1, 'backward');
      setCurrentStep(c => c - 1);
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 max-w-5xl mx-auto flex flex-col items-center">
      
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <div className="inline-block px-4 py-1 rounded-full bg-accent/20 text-accent-foreground font-bold text-xs uppercase tracking-widest mb-2 border border-accent/20">
          AI Puzzle Solver
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
          Sort <span className="text-primary">Master</span>
        </h1>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          {solutionMode 
            ? "Follow the steps below to solve the puzzle." 
            : "Click tubes to add colors. Right-click to remove."}
        </p>
      </motion.div>

      {/* Game Board */}
      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
        
        {/* Tubes Area */}
        <div className="order-2 md:order-1 glass-panel rounded-3xl p-8 min-h-[400px] flex items-center justify-center">
          <motion.div 
            layout
            className="flex flex-wrap justify-center gap-x-8 gap-y-12"
          >
            <AnimatePresence>
              {tubes.map((colors, idx) => (
                <Tube 
                  key={idx}
                  id={idx}
                  colors={colors}
                  maxCapacity={MAX_CAPACITY}
                  onClick={() => handleTubeClick(idx)}
                  // Highlight source/dest in solution mode?
                  isSelected={solutionMode && currentStep < solutionMoves.length && solutionMoves[currentStep].from === idx}
                  isTarget={solutionMode && currentStep < solutionMoves.length && solutionMoves[currentStep].to === idx}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Sidebar Controls */}
        <div className="order-1 md:order-2 flex flex-col gap-6 sticky top-8">
          
          {!solutionMode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <ColorPalette 
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />
              
              <div className="glass-panel p-6 rounded-2xl">
                <Controls 
                  onSolve={handleSolve}
                  onClear={handleClear}
                  onAddTube={handleAddTube}
                  onRemoveTube={handleRemoveTube}
                  onReset={handleClear}
                  canSolve={tubes.some(t => t.length > 0)}
                  isSolving={solveMutation.isPending}
                  solutionMode={false}
                />
              </div>
            </motion.div>
          )}

          {solutionMode && (
             <Controls 
                onSolve={() => {}}
                onClear={() => {}}
                onAddTube={() => {}}
                onRemoveTube={() => {}}
                onReset={handleReset}
                canSolve={false}
                isSolving={false}
                solutionMode={true}
                onNextStep={handleNextStep}
                onPrevStep={handlePrevStep}
                currentStep={currentStep}
                totalSteps={solutionMoves.length}
             />
          )}

        </div>
      </div>
      
    </div>
  );
}
