import React from 'react';

interface BackgroundLayerProps {
    viewport: { x: number; y: number; zoom: number };
}

const GRID_SIZE = 50;

const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ viewport }) => {
    const scaledGrid = GRID_SIZE * viewport.zoom;
    const offsetX = ((viewport.x % scaledGrid) + scaledGrid) % scaledGrid;
    const offsetY = ((viewport.y % scaledGrid) + scaledGrid) % scaledGrid;

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        >
            <defs>
                <pattern
                    id="whiteboard-dot-grid"
                    x={offsetX}
                    y={offsetY}
                    width={scaledGrid}
                    height={scaledGrid}
                    patternUnits="userSpaceOnUse"
                >
                    <circle
                        cx={scaledGrid / 2}
                        cy={scaledGrid / 2}
                        r={1.5}
                        className="fill-neutral-300 dark:fill-neutral-600"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#whiteboard-dot-grid)" />
        </svg>
    );
};

export default BackgroundLayer;
