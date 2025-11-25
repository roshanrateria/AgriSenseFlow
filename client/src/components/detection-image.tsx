import { useState, useRef } from "react";
import type { DetectionResult } from "@shared/schema";

interface DetectionImageProps {
    imageUrl: string;
    predictions: DetectionResult["predictions"];
}

export function DetectionImage({ imageUrl, predictions }: DetectionImageProps) {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setDimensions({ width: naturalWidth, height: naturalHeight });
    };

    return (
        <div className="relative rounded-lg overflow-hidden border bg-muted inline-block">
            <img
                ref={imageRef}
                src={imageUrl}
                alt="Detected crop"
                className="max-w-full h-auto block"
                onLoad={onImageLoad}
            />
            {dimensions && (
                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                >
                    {predictions.map((pred, index) => {
                        const [x1, y1, x2, y2] = pred.bbox;
                        const width = x2 - x1;
                        const height = y2 - y1;

                        return (
                            <g key={index}>
                                <rect
                                    x={x1}
                                    y={y1}
                                    width={width}
                                    height={height}
                                    fill="none"
                                    stroke="#ef4444" // red-500
                                    strokeWidth="4"
                                />
                                <rect
                                    x={x1}
                                    y={y1 - 24}
                                    width={width} // Background for text? Maybe just a small badge
                                    height="24"
                                    fill="#ef4444"
                                    className="opacity-0" // Invisible rect for spacing if needed, but let's do a text background
                                />
                                <g transform={`translate(${x1}, ${y1 - 5})`}>
                                    <rect x="0" y="-20" width={pred.class_name.length * 10 + 50} height="24" fill="#ef4444" rx="4" />
                                    <text
                                        x="5"
                                        y="-4"
                                        fill="white"
                                        fontSize="14"
                                        fontWeight="bold"
                                        fontFamily="sans-serif"
                                    >
                                        {pred.class_name} {Math.round(pred.confidence * 100)}%
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );
}
