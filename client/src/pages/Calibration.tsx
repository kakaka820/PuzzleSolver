//色選択画面
//client/src/pages/Calibration.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MousePointer2, Plus, Trash2, RotateCcw, Palette, Image as ImageIcon } from "lucide-react";
import { useLocation } from "wouter";
import { getPixelColor, type RGB, type Point } from "@/lib/image-processor";

interface PaletteColor {
  id: string;
  color: RGB;
  name?: string;
}

interface BackgroundConfig {
  color: RGB | null;
  enabled: boolean;
}

export default function Calibration() {
  const [image, setImage] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [background, setBackground] = useState<BackgroundConfig>({ color: null, enabled: false });
  const [selectionMode, setSelectionMode] = useState<"palette" | "background">("palette");
  const [activeColorId, setActiveColorId] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedImage = sessionStorage.getItem("puzzle_image");
    if (!savedImage) {
      setLocation("/");
      return;
    }
    setImage(savedImage);

    const savedPalette = sessionStorage.getItem("color_palette");
    if (savedPalette) {
      setPalette(JSON.parse(savedPalette));
    }
    
    const savedBg = sessionStorage.getItem("background_config");
    if (savedBg) {
      setBackground(JSON.parse(savedBg));
    }
  }, [setLocation]);

  const sampleColor = useCallback((x: number, y: number): RGB | null => {
    if (!imageRef.current) return null;
    const img = imageRef.current;
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      return getPixelColor(ctx, Math.floor(x), Math.floor(y), 5);
    }
    return null;
  }, []);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
    const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
    
    const color = sampleColor(x, y);
    if (!color) return;

    if (selectionMode === "palette") {
      const newColor: PaletteColor = {
        id: Math.random().toString(36).substr(2, 9),
        color
      };
      const updated = [...palette, newColor];
      setPalette(updated);
      sessionStorage.setItem("color_palette", JSON.stringify(updated));
    } else {
      const newBg = { color, enabled: true };
      setBackground(newBg);
      sessionStorage.setItem("background_config", JSON.stringify(newBg));
      setSelectionMode("palette"); // 背景色選択後はパレットモードに戻す
    }
  };

  const removePaletteColor = (id: string) => {
    const updated = palette.filter(c => c.id !== id);
    setPalette(updated);
    sessionStorage.setItem("color_palette", JSON.stringify(updated));
  };

  const handleNext = () => {
    setLocation("/solver");
  };

  if (!image) return null;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">Setup Colors</h1>
              <p className="text-sm text-muted-foreground">Register representative colors and optional background</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => {
              setPalette([]);
              setBackground({ color: null, enabled: false });
              sessionStorage.removeItem("color_palette");
              sessionStorage.removeItem("background_config");
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleNext} disabled={palette.length === 0}>
              Continue to Solve
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 overflow-hidden shadow-md">
            <CardContent className="p-0 bg-black/5 relative min-h-[60vh] flex items-center justify-center">
              <div 
                className={`relative w-full h-full flex items-center justify-center select-none p-4 cursor-crosshair ${selectionMode === 'background' ? 'ring-4 ring-inset ring-blue-400' : ''}`}
                onClick={handleImageClick}
              >
                <img 
                  ref={imageRef}
                  src={image} 
                  alt="Puzzle screenshot" 
                  className="max-w-full max-h-[80vh] object-contain pointer-events-none shadow-2xl rounded"
                />
                {selectionMode === 'background' && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-30 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Background Selection Mode: Click background area
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md h-fit">
            <CardContent className="p-6 space-y-6">
              {/* Background Color Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  Background Color (Optional)
                </h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div 
                    className="w-10 h-10 rounded-md border shadow-sm"
                    style={{ backgroundColor: background.color ? `rgb(${background.color.r}, ${background.color.g}, ${background.color.b})` : 'transparent' }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {background.color ? "Registered" : "Not Registered"}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-[10px]"
                      onClick={() => setSelectionMode("background")}
                    >
                      {background.color ? "Reselect" : "Click to Select"}
                    </Button>
                  </div>
                  {background.color && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setBackground({ color: null, enabled: false });
                        sessionStorage.removeItem("background_config");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <hr />

              {/* Palette Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Color Palette ({palette.length})
                  </h3>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {palette.map((item) => (
                    <div 
                      key={item.id}
                      className="group relative aspect-square rounded-md border shadow-sm cursor-default"
                      style={{ backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})` }}
                    >
                      <button 
                        className="absolute -top-1 -right-1 bg-white rounded-full shadow-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePaletteColor(item.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <button 
                    className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-primary/5 hover:border-primary transition-all"
                    onClick={() => setSelectionMode("palette")}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {palette.length === 0 && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    Click the image to register colors used in the puzzle.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                <MousePointer2 className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  1. Add colors found in bottles.<br />
                  2. (Optional) Register background color to improve accuracy.<br />
                  3. Colors will be matched automatically during solving.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
