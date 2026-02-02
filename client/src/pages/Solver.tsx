import { useState, useEffect, useRef } from "react";
import { Tube } from "@/components/Tube";
import { ColorPalette } from "@/components/ColorPalette";
import { Controls } from "@/components/Controls";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { detectPuzzleState } from "@/lib/image-processor";
import { Button } from "@/components/ui/button";
import { solvePuzzle } from "@shared/solver";

const MAX_CAPACITY = 4;

export default function Solver() {
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [solutionMode, setSolutionMode] = useState(false);
  const [solutionMoves, setSolutionMoves] = useState<{from: number, to: number}[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [originalState, setOriginalState] = useState<string[][]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [palette, setPalette] = useState<{ id: string; color: any }[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const analysisPerformed = useRef(false);

  useEffect(() => {
    async function init() {
      if (analysisPerformed.current) return;
      
      const imageData = sessionStorage.getItem("puzzle_image");
      const savedPalette = localStorage.getItem("color_palette");
      const savedBg = localStorage.getItem("background_config");

      if (!imageData || !savedPalette) {
        setLocation("/calibration");
        return;
      }

      const parsedPalette = JSON.parse(savedPalette);
      const parsedBg = savedBg ? JSON.parse(savedBg) : { color: null, enabled: false };
      setPalette(parsedPalette);
      if (parsedPalette.length > 0) setSelectedColorId(parsedPalette[0].id);

      try {
        const img = new Image();
        img.src = imageData;
        await new Promise((resolve) => (img.onload = resolve));
        
        let state = await detectPuzzleState(img, parsedPalette, parsedBg);
        
        // 1. 解析結果をフィルタリング: パレットに含まれない色（ID）を除去する
        const validPaletteIds = new Set(parsedPalette.map((p: any) => p.id));
        state = state.map(tube => tube.filter(id => validPaletteIds.has(id)));

        // 2. 補完ロジック: パレットの色数分は最低限筒を表示する
        const minTubesNeeded = Math.max(state.length, parsedPalette.length);
        while (state.length < minTubesNeeded) {
          state.push([]);
        }

        setTubes(state);
        setIsAnalyzing(false);
        analysisPerformed.current = true;
      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", description: "Failed to analyze image" });
        setIsAnalyzing(false);
      }
    }
    init();
  }, [setLocation, toast]);

  const handleReset = () => {
    if (solutionMode) {
      setTubes(originalState);
      setSolutionMode(false);
      setSolutionMoves([]);
      setCurrentStep(0);
    }
  };

  const handleClear = () => {
    setTubes(tubes.map(() => []));
    toast({ description: "Board cleared" });
  };

  const handleAddTube = () => {
    if (tubes.length >= 14) {
      toast({ variant: "destructive", description: "Max 14 tubes allowed" });
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
    if (selectedColorId === null) {
      toast({ description: "Select a color from the palette first" });
      return;
    }

    setTubes(prev => {
      const newTubes = [...prev];
      const tube = [...newTubes[tubeIndex]];

      if (tube.length > 0 && tube[tube.length - 1] === selectedColorId) {
        tube.pop();
      } else if (tube.length < MAX_CAPACITY) {
        tube.push(selectedColorId);
      }
      
      newTubes[tubeIndex] = tube;
      return newTubes;
    });
  };

  const handleSolve = async () => {
    const idMap = new Map<string, number>();
    palette.forEach((p, i) => idMap.set(p.id, i + 1));

    const numericTubes = tubes.map(t => t.map(colorId => idMap.get(colorId)!));

    setIsSolving(true);
    try {
      // サーバーを介さず、ブラウザ上で直接計算を実行
      const result = solvePuzzle(numericTubes, MAX_CAPACITY, "nut");
      
      if (!result.solvable) {
        toast({ 
          variant: "destructive", 
          title: "Unsolvable!", 
          description: "This configuration has no solution." 
        });
        setIsSolving(false);
        return;
      }

      setOriginalState(JSON.parse(JSON.stringify(tubes)));
      setSolutionMoves(result.moves);
      setSolutionMode(true);
      setCurrentStep(0);
      
      toast({ 
        title: "Solved!", 
        description: `Solution found in ${result.moves.length} steps.`,
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSolving(false);
    }
  };

  const applyMove = (moveIndex: number, direction: 'forward' | 'backward') => {
    setTubes(prev => {
      const nextTubes = prev.map(t => [...t]);
      const move = solutionMoves[moveIndex];

      if (direction === 'forward') {
        const color = nextTubes[move.from].pop();
        if (color !== undefined) nextTubes[move.to].push(color);
      } else {
        const color = nextTubes[move.to].pop();
        if (color !== undefined) nextTubes[move.from].push(color);
      }
      return nextTubes;
    });
  };

  const handleNextStep = () => {
    if (currentStep < solutionMoves.length) {
      applyMove(currentStep, 'forward');
      setCurrentStep(c => c + 1);
      if (currentStep + 1 === solutionMoves.length) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      applyMove(currentStep - 1, 'backward');
      setCurrentStep(c => c - 1);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg font-medium text-gray-600">Analyzing image structure...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 max-w-6xl mx-auto flex flex-col items-center">
      <header className="w-full flex justify-start mb-8">
        <Button variant="ghost" onClick={() => setLocation("/calibration")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Setup
        </Button>
      </header>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
          Solution <span className="text-primary">Viewer</span>
        </h1>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          {solutionMode 
            ? "Follow the steps to solve the puzzle." 
            : "Automatic detection complete. Adjust any errors before solving."}
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        <div className="order-2 lg:order-1 glass-panel rounded-3xl p-8 min-h-[500px] flex items-center justify-center">
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-x-8 gap-y-12">
            <AnimatePresence>
              {tubes.map((contents, idx) => (
                <Tube 
                  key={idx}
                  id={idx}
                  // Pass the actual palette IDs (strings) instead of fixed numeric indexes
                  colors={contents}
                  palette={palette}
                  maxCapacity={MAX_CAPACITY}
                  onClick={() => handleTubeClick(idx)}
                  isSelected={solutionMode && currentStep < solutionMoves.length && solutionMoves[currentStep].from === idx}
                  isTarget={solutionMode && currentStep < solutionMoves.length && solutionMoves[currentStep].to === idx}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="order-1 lg:order-2 flex flex-col gap-6 sticky top-8">
          {!solutionMode && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <ColorPalette 
                selectedColorId={selectedColorId}
                onSelectColor={setSelectedColorId}
                palette={palette}
              />
              <div className="glass-panel p-6 rounded-2xl">
                <Controls 
                  onSolve={handleSolve}
                  onClear={handleClear}
                  onAddTube={handleAddTube}
                  onRemoveTube={handleRemoveTube}
                  onReset={handleClear}
                  canSolve={tubes.some(t => t.length > 0)}
                  isSolving={isSolving}
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
