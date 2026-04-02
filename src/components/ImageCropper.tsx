import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const TARGET_SIZE = 512;
  const scale = Math.min(TARGET_SIZE / pixelCrop.width, TARGET_SIZE / pixelCrop.height, 1);

  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) return "";

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  try {
    return canvas.toDataURL('image/webp', 0.9);
  } catch (e) {
    console.error("Error generating cropped image:", e);
    return "";
  }
};

const ImageCropper = ({ imageSrc, onClose, onCropComplete }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleApply = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1f22] w-full max-w-[440px] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#dbdee1]">
        
        {/* Header Discord Style */}
        <div className="flex justify-between items-center p-4 border-b border-[#2b2d31]">
          <h2 className="text-lg font-bold text-white">Editar imagem</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative w-full h-[300px] bg-black/50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls Discord Style */}
        <div className="p-6 bg-[#2b2d31] flex flex-col gap-6">
          <div className="flex items-center gap-3 w-full px-4">
            <ImageIcon className="w-4 h-4 opacity-50" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full flex-1 h-1.5 bg-black/40 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-pointer"
            />
            <ImageIcon className="w-6 h-6 opacity-80" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button 
               onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }} 
               className="text-sm font-medium hover:underline text-gray-300"
            >
              Redefinir
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-2 rounded text-sm font-medium hover:underline transition-colors text-white"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              {imageSrc?.startsWith('data:image/gif') && (
                <button 
                  onClick={() => {
                     setIsProcessing(true);
                     if (imageSrc) {
                        onCropComplete(imageSrc);
                     }
                  }} 
                  className="bg-yellow-500/20 text-yellow-500 px-6 py-2 rounded text-sm font-bold hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                  disabled={isProcessing}
                >
                  Manter Animado
                </button>
              )}

              <button 
                onClick={handleApply} 
                disabled={isProcessing}
                className="bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2 rounded text-sm font-bold transition-colors text-white disabled:opacity-50"
              >
                {isProcessing ? "Aplicando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
