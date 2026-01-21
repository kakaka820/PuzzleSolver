import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MousePointer2, Plus, Trash2, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { getPixelColor, type RGB, type Point } from "@/lib/image-processor";

interface SamplingPoint extends Point {
  id: string;
  color: RGB | null;
}

export default function Calibration() {
  const [image, setImage] = useState<string | null>(null);
  const [samplingPoints, setSamplingPoints] = useState<SamplingPoint[]>([]);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedImage = sessionStorage.getItem("puzzle_image");
    if (!savedImage) {
      setLocation("/");
      return;
    }
    setImage(savedImage);

    const savedPoints = sessionStorage.getItem("sampling_points");
    if (savedPoints) {
      setSamplingPoints(JSON.parse(savedPoints));
    }
  }, [setLocation]);

  const updatePointColor = useCallback((point: Point): RGB | null => {
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
      return getPixelColor(ctx, Math.floor(point.x), Math.floor(point.y), 3);
    }
    return null;
  }, []);

  const addPointAt = useCallback((x: number, y: number) => {
    const newPoint: SamplingPoint = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      color: null
    };
    newPoint.color = updatePointColor({ x, y });
    setSamplingPoints(prev => {
      const updated = [...prev, newPoint];
      sessionStorage.setItem("sampling_points", JSON.stringify(updated));
      return updated;
    });
    setActivePointId(newPoint.id);
  }, [updatePointColor]);

  const removePoint = (id: string) => {
    setSamplingPoints(prev => {
      const updated = prev.filter(p => p.id !== id);
      sessionStorage.setItem("sampling_points", JSON.stringify(updated));
      return updated;
    });
    if (activePointId === id) setActivePointId(null);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !activePointId || !imageRef.current) return;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const x = Math.max(0, Math.min(img.naturalWidth, (clientX - rect.left) * (img.naturalWidth / rect.width)));
    const y = Math.max(0, Math.min(img.naturalHeight, (clientY - rect.top) * (img.naturalHeight / rect.height)));
    
    setSamplingPoints(prev => {
      const updated = prev.map(p => {
        if (p.id === activePointId) {
          const color = updatePointColor({ x, y });
          return { ...p, x, y, color };
        }
        return p;
      });
      sessionStorage.setItem("sampling_points", JSON.stringify(updated));
      return updated;
    });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // If we were dragging, don't add a new point
    if (isDragging.current) return;
    
    if (!imageRef.current) return;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
    const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
    
    addPointAt(x, y);
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
              <h1 className="text-2xl font-bold text-gray-900 font-display">Calibrate Colors</h1>
              <p className="text-sm text-muted-foreground">Click image to add markers, drag to adjust</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => {
              setSamplingPoints([]);
              sessionStorage.removeItem("sampling_points");
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleNext} disabled={samplingPoints.length === 0}>
              Start Solving
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 overflow-hidden shadow-md">
            <CardContent className="p-0 bg-black/5 relative min-h-[60vh] flex items-center justify-center">
              <div 
                className="relative w-full h-full flex items-center justify-center select-none p-4 cursor-crosshair"
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
                onMouseUp={() => setTimeout(() => isDragging.current = false, 50)}
                onTouchEnd={() => setTimeout(() => isDragging.current = false, 50)}
                onMouseLeave={() => isDragging.current = false}
                onClick={handleImageClick}
              >
                <img 
                  ref={imageRef}
                  src={image} 
                  alt="Puzzle screenshot" 
                  className="max-w-full max-h-[80vh] object-contain pointer-events-none shadow-2xl rounded"
                />
                
                {imageRef.current && samplingPoints.map((point) => {
                  const rect = imageRef.current!.getBoundingClientRect();
                  const displayX = (point.x / imageRef.current!.naturalWidth) * rect.width;
                  const displayY = (point.y / imageRef.current!.naturalHeight) * rect.height;
                  const isActive = point.id === activePointId;

                  return (
                    <div
                      key={point.id}
                      className={`absolute w-6 h-6 -ml-3 -mt-3 cursor-move flex items-center justify-center transition-all ${isActive ? 'scale-125 z-20' : 'z-10'}`}
                      style={{ 
                        left: `${(imageRef.current!.offsetLeft - imageRef.current!.parentElement!.offsetLeft) + displayX}px`,
                        top: `${(imageRef.current!.offsetTop - imageRef.current!.parentElement!.offsetTop) + displayY}px`
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActivePointId(point.id);
                        isDragging.current = true;
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setActivePointId(point.id);
                        isDragging.current = true;
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`w-full h-full rounded-full border-2 shadow-xl flex items-center justify-center ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-white'}`}
                           style={{ backgroundColor: point.color ? `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})` : 'transparent' }}>
                        <div className="w-1 h-1 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md h-fit">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Markers ({samplingPoints.length})</h2>
                </div>
                
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                  {samplingPoints.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-8">
                      Click on the image to add your first marker
                    </p>
                  )}
                  {samplingPoints.map((point, index) => (
                    <div 
                      key={point.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${point.id === activePointId ? 'bg-primary/5 border-primary' : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => setActivePointId(point.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-md border shadow-sm"
                          style={{ backgroundColor: point.color ? `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})` : 'transparent' }}
                        />
                        <div>
                          <p className="text-xs font-medium">Marker #{index + 1}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {Math.round(point.x)}, {Math.round(point.y)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePoint(point.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                <MousePointer2 className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Click the image to place a marker. Drag existing markers to adjust.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
