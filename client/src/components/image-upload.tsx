import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
  showCamera?: boolean;
}

export function ImageUpload({
  onImageSelect,
  isProcessing,
  showCamera = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setPreview(URL.createObjectURL(file));
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled: isProcessing || cameraActive,
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", {
              type: "image/jpeg",
            });
            setPreview(URL.createObjectURL(file));
            onImageSelect(file);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const clearImage = () => {
    setPreview(null);
    stopCamera();
  };

  if (cameraActive) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-primary/50 pointer-events-none" />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={capturePhoto}
              className="flex-1"
              size="lg"
              data-testid="button-capture-photo"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture Photo
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              size="lg"
              data-testid="button-cancel-camera"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (preview) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm font-medium">Analyzing image...</p>
                </div>
              </div>
            )}
          </div>
          {!isProcessing && (
            <Button
              onClick={clearImage}
              variant="outline"
              className="w-full"
              data-testid="button-clear-image"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Image
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 sm:p-12 cursor-pointer transition-colors text-center",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
        data-testid="dropzone-upload"
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">
              {isDragActive ? "Drop image here..." : "Upload Crop Image"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, WEBP
            </p>
          </div>
          {showCamera && (
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              variant="outline"
              className="mt-4"
              data-testid="button-start-camera"
            >
              <Camera className="h-4 w-4 mr-2" />
              Use Camera
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
