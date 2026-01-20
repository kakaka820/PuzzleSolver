import { Button } from "@/components/ui/button";
import { 
  Play, 
  RotateCcw, 
  Wand2, 
  Eraser, 
  Plus, 
  Minus,
  StepForward,
  StepBack
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ControlsProps {
  onSolve: () => void;
  onClear: () => void;
  onAddTube: () => void;
  onRemoveTube: () => void;
  onReset: () => void;
  canSolve: boolean;
  isSolving: boolean;
  solutionMode: boolean;
  
  // Solution playback controls
  onNextStep?: () => void;
  onPrevStep?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export function Controls({ 
  onSolve, 
  onClear, 
  onAddTube, 
  onRemoveTube,
  onReset,
  canSolve,
  isSolving,
  solutionMode,
  onNextStep,
  onPrevStep,
  currentStep = 0,
  totalSteps = 0
}: ControlsProps) {

  if (solutionMode) {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-primary/10 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevStep}
          disabled={currentStep === 0}
          className="rounded-full w-12 h-12 hover:bg-muted/50 border-2"
        >
          <StepBack className="w-5 h-5 text-muted-foreground" />
        </Button>

        <div className="flex flex-col items-center px-4 min-w-[120px]">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-display">Step</span>
          <span className="text-2xl font-bold font-display text-primary tabular-nums">
            {currentStep} <span className="text-muted-foreground/40 text-lg">/ {totalSteps}</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onNextStep}
          disabled={currentStep === totalSteps}
          className="rounded-full w-12 h-12 hover:bg-muted/50 border-2"
        >
          <StepForward className="w-5 h-5 text-muted-foreground" />
        </Button>

        <div className="w-px h-8 bg-border mx-2" />

        <Button 
          variant="ghost" 
          onClick={onReset}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
        >
          Exit Mode
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Primary Action */}
      <Button
        onClick={onSolve}
        disabled={!canSolve || isSolving}
        className="w-full h-14 text-lg font-bold font-display rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all bg-gradient-to-r from-primary to-rose-400"
      >
        {isSolving ? (
          <>
            <Wand2 className="mr-2 h-5 w-5 animate-spin" />
            Solving...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-5 w-5" />
            Solve Puzzle
          </>
        )}
      </Button>

      <div className="grid grid-cols-4 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" onClick={onAddTube} className="h-12 rounded-xl bg-white shadow-sm border border-border/50 hover:bg-accent/10 hover:text-accent-foreground">
              <Plus className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Tube</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" onClick={onRemoveTube} className="h-12 rounded-xl bg-white shadow-sm border border-border/50 hover:bg-destructive/10 hover:text-destructive">
              <Minus className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove Tube</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" onClick={onClear} className="h-12 rounded-xl bg-white shadow-sm border border-border/50 text-orange-500 hover:bg-orange-50">
              <Eraser className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear All</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" onClick={onReset} className="h-12 rounded-xl bg-white shadow-sm border border-border/50 text-blue-500 hover:bg-blue-50">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset State</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
