import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";


export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
     const imageData = e.target?.result as string;
      setSelectedImage(imageData);
      // Save to session storage to pass to next page
      sessionStorage.setItem("puzzle_image", imageData);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-10 flex flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 font-display">Puzzle Solver</h1>
            <p className="text-muted-foreground">Upload a screenshot to start solving</p>
          </div>
          
          <div 
            className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer relative overflow-hidden group shadow-sm"
            onClick={triggerFileInput}
          >
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-400 group-hover:text-primary transition-colors">
                <div className="p-4 bg-gray-50 rounded-full group-hover:bg-primary/5">
                  <ImageIcon className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-600">Click to upload image</p>
                  <p className="text-sm">or paste from clipboard</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={triggerFileInput} size="lg" variant={selectedImage ? "outline" : "default"}>
              <Upload className="w-4 h-4 mr-2" />
              {selectedImage ? "Change Image" : "Select Image"}
            </Button>
            {selectedImage && (
              <Button onClick={() => setLocation("/calibration")} size="lg" className="px-8">
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
