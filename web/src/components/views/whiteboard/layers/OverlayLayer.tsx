import React from 'react';
import { WhiteboardEdgeData } from '../../../../types/view';
import { WhiteboardObject, Viewport, Bounds, Point } from '../tools/types';

interface HoverTarget {
    objectId: string;
    connectionPoint: 'top' | 'bottom' | 'left' | 'right';
    position: Point;
}

interface ShapePreview {
    startPoint: Point;
    currentPoint: Point;
    tool: 'rectangle' | 'circle' | 'line';
}

interface EdgePreview {
    startPoint: Point;
    endPoint: Point;
    hoverTarget: HoverTarget | null;
    color: string;
    strokeWidth: number;
}

interface SelectionBox {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

interface OverlayLayerProps {
    viewObjects: Map<string, WhiteboardObject>;
    viewport: Viewport;
    selectedObjectIds: string[];
    selectedBounds: Map<string, Bounds | null>;
    isSelecting: boolean;
    selectionBox: SelectionBox | null;
    shapePreview: ShapePreview | null;
    edgePreview: EdgePreview | null;
    currentColor: string;
    currentStrokeWidth: number;
}

// Compute SVG path d attribute for an edge
const computeEdgePath = (data: WhiteboardEdgeData): string => {
    const sx = data.startPoint.x;
    const sy = data.startPoint.y;
    const ex = data.endPoint.x;
    const ey = data.endPoint.y;

    if (data.curveType === 'bezier') {
        const midX = (sx + ex) / 2;
        const midY = (sy + ey) / 2;
        return `M ${sx} ${sy} Q ${midX} ${sy} ${midX} ${midY} Q ${midX} ${ey} ${ex} ${ey}`;
    }
    if (data.curveType === 'elbow') {
        const midX = (sx + ex) / 2;
        return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`;
    }
    // straight (default)
    return `M ${sx} ${sy} L ${ex} ${ey}`;
};

// Arrow angle computation matching canvas renderEdge logic
const getArrowAngles = (data: WhiteboardEdgeData): { startAngle: number; endAngle: number } => {
    const sx = data.startPoint.x;
    const sy = data.startPoint.y;
    const ex = data.endPoint.x;
    const ey = data.endPoint.y;

    if (data.curveType === 'bezier') {
        const midX = (sx + ex) / 2;
        const startAngle = Math.atan2(0, midX - sx) + Math.PI;
        const endAngle = Math.atan2(ey - ey, ex - midX); // approaching ex,ey from midX,ey
        return { startAngle, endAngle };
    }
    if (data.curveType === 'elbow') {
        const midX = (sx + ex) / 2;
        const startAngle = sx < midX ? Math.PI : 0;
        const endAngle = ex > midX ? 0 : Math.PI;
        return { startAngle, endAngle };
    }
    const angle = Math.atan2(ey - sy, ex - sx);
    return { startAngle: angle + Math.PI, endAngle: angle };
};

interface ArrowHeadProps {
    x: number;
    y: number;
    angle: number;
    size: number;
    color: string;
}

const ArrowHead: React.FC<ArrowHeadProps> = ({ x, y, angle, size, color }) => (
    <g transform={`translate(${x},${y}) rotate(${(angle * 180) / Math.PI})`}>
        <polygon points={`0,0 ${-size},${size / 2} ${-size},${-size / 2}`} fill={color} />
    </g>
);

const DASH_PATTERNS: Record<string, string | undefined> = {
    solid: undefined,
    dashed: '10 5',
    dotted: '2 4',
};

const CONNECTION_POINTS: Array<{ key: string; getPos: (b: Bounds) => Point }> = [
    { key: 'top', getPos: b => ({ x: b.x + b.width / 2, y: b.y }) },
    { key: 'bottom', getPos: b => ({ x: b.x + b.width / 2, y: b.y + b.height }) },
    { key: 'left', getPos: b => ({ x: b.x, y: b.y + b.height / 2 }) },
    { key: 'right', getPos: b => ({ x: b.x + b.width, y: b.y + b.height / 2 }) },
];

const CORNERS: Array<{ key: string; getPos: (b: Bounds) => Point }> = [
    { key: 'nw', getPos: b => ({ x: b.x, y: b.y }) },
    { key: 'ne', getPos: b => ({ x: b.x + b.width, y: b.y }) },
    { key: 'sw', getPos: b => ({ x: b.x, y: b.y + b.height }) },
    { key: 'se', getPos: b => ({ x: b.x + b.width, y: b.y + b.height }) },
];

const OverlayLayer: React.FC<OverlayLayerProps> = ({
    viewObjects,
    viewport,
    selectedObjectIds,
    selectedBounds,
    isSelecting,
    selectionBox,
    shapePreview,
    edgePreview,
    currentColor,
    currentStrokeWidth,
}) => {
    const zoom = viewport.zoom;
    const arrowSize = 10;
    const handleSize = 8 / zoom;
    const cpRadius = 6 / zoom;
    const strokeInv = 2 / zoom;
    const dashArr = `${5 / zoom} ${5 / zoom}`;

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 30 }}
        >
            <defs>
                {/* No global markers — we draw arrows inline for color flexibility */}
            </defs>

            {/* All world-space elements inside the viewport-transformed group */}
            <g transform={`translate(${viewport.x},${viewport.y}) scale(${zoom})`}>

                {/* Edges */}
                {Array.from(viewObjects.entries()).map(([id, obj]) => {
                    if (obj.type !== 'whiteboard_edge') return null;
                    const data = obj.data as WhiteboardEdgeData;
                    if (!data?.startPoint || !data?.endPoint) return null;

                    const color = data.color || '#000000';
                    const sw = data.strokeWidth || 2;
                    const pathD = computeEdgePath(data);
                    const dashPattern = DASH_PATTERNS[data.lineStyle ?? 'solid'];
                    const isSelected = selectedObjectIds.includes(id);
                    const { startAngle, endAngle } = getArrowAngles(data);

                    return (
                        <g key={id}>
                            <path
                                d={pathD}
                                stroke={color}
                                strokeWidth={sw}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={dashPattern}
                            />
                            {/* Arrow heads */}
                            {(data.arrowType === 'start' || data.arrowType === 'both') && (
                                <ArrowHead x={data.startPoint.x} y={data.startPoint.y} angle={startAngle} size={arrowSize} color={color} />
                            )}
                            {(data.arrowType === 'end' || data.arrowType === 'both') && (
                                <ArrowHead x={data.endPoint.x} y={data.endPoint.y} angle={endAngle} size={arrowSize} color={color} />
                            )}
                            {/* Selected edge handles */}
                            {isSelected && (
                                <>
                                    <circle cx={data.startPoint.x} cy={data.startPoint.y} r={handleSize / 2}
                                        fill="#3b82f6" stroke="#ffffff" strokeWidth={strokeInv} />
                                    <circle cx={data.endPoint.x} cy={data.endPoint.y} r={handleSize / 2}
                                        fill="#3b82f6" stroke="#ffffff" strokeWidth={strokeInv} />
                                </>
                            )}
                        </g>
                    );
                })}

                {/* Selection handles for non-edge selected objects */}
                {selectedObjectIds.map(id => {
                    const bounds = selectedBounds.get(id);
                    if (!bounds) return null;
                    // Skip edges (handled above) and notes (NoteOverlay renders its own HTML selection UI)
                    const obj = viewObjects.get(id);
                    if (obj?.type === 'whiteboard_edge') return null;
                    if (obj?.type === 'whiteboard_note') return null;

                    return (
                        <g key={`sel-${id}`}>
                            {/* Dashed selection border */}
                            <rect
                                x={bounds.x - 5}
                                y={bounds.y - 5}
                                width={bounds.width + 10}
                                height={bounds.height + 10}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth={strokeInv}
                                strokeDasharray={dashArr}
                            />
                            {/* Corner resize handles */}
                            {CORNERS.map(c => {
                                const p = c.getPos(bounds);
                                return (
                                    <rect
                                        key={c.key}
                                        x={p.x - handleSize / 2}
                                        y={p.y - handleSize / 2}
                                        width={handleSize}
                                        height={handleSize}
                                        fill="#3b82f6"
                                        stroke="#ffffff"
                                        strokeWidth={strokeInv}
                                    />
                                );
                            })}
                            {/* Edge connection points */}
                            {CONNECTION_POINTS.map(cp => {
                                const p = cp.getPos(bounds);
                                return (
                                    <circle
                                        key={cp.key}
                                        cx={p.x}
                                        cy={p.y}
                                        r={cpRadius}
                                        fill="#10b981"
                                        stroke="#ffffff"
                                        strokeWidth={strokeInv}
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {/* Marquee selection box */}
                {isSelecting && selectionBox && (() => {
                    const x = Math.min(selectionBox.startX, selectionBox.currentX);
                    const y = Math.min(selectionBox.startY, selectionBox.currentY);
                    const w = Math.abs(selectionBox.currentX - selectionBox.startX);
                    const h = Math.abs(selectionBox.currentY - selectionBox.startY);
                    return (
                        <rect
                            x={x} y={y} width={w} height={h}
                            fill="rgba(59,130,246,0.1)"
                            stroke="#3b82f6"
                            strokeWidth={strokeInv}
                            strokeDasharray={dashArr}
                        />
                    );
                })()}

                {/* Shape tool preview */}
                {shapePreview && (() => {
                    const { startPoint: sp, currentPoint: cp, tool } = shapePreview;
                    const previewStyle = {
                        stroke: currentColor,
                        strokeWidth: currentStrokeWidth,
                        fill: 'none',
                        strokeLinecap: 'round' as const,
                    };
                    if (tool === 'rectangle') {
                        const x = Math.min(sp.x, cp.x);
                        const y = Math.min(sp.y, cp.y);
                        const w = Math.abs(cp.x - sp.x);
                        const h = Math.abs(cp.y - sp.y);
                        return <rect x={x} y={y} width={w} height={h} {...previewStyle} />;
                    }
                    if (tool === 'circle') {
                        const radius = Math.sqrt(Math.pow(cp.x - sp.x, 2) + Math.pow(cp.y - sp.y, 2));
                        return <circle cx={sp.x} cy={sp.y} r={radius} {...previewStyle} />;
                    }
                    if (tool === 'line') {
                        return <line x1={sp.x} y1={sp.y} x2={cp.x} y2={cp.y} {...previewStyle} />;
                    }
                    return null;
                })()}

                {/* Edge tool preview */}
                {edgePreview && (() => {
                    const { startPoint: sp, endPoint: ep, hoverTarget, color, strokeWidth: sw } = edgePreview;
                    const angle = Math.atan2(ep.y - sp.y, ep.x - sp.x);
                    return (
                        <g>
                            <line
                                x1={sp.x} y1={sp.y} x2={ep.x} y2={ep.y}
                                stroke={color}
                                strokeWidth={sw}
                                strokeLinecap="round"
                            />
                            <ArrowHead x={ep.x} y={ep.y} angle={angle} size={arrowSize} color={color} />
                            {/* Snap indicator at hover target */}
                            {hoverTarget && (
                                <circle
                                    cx={hoverTarget.position.x}
                                    cy={hoverTarget.position.y}
                                    r={12}
                                    fill="rgba(16,185,129,0.3)"
                                    stroke="#10b981"
                                    strokeWidth={strokeInv * 1.5}
                                />
                            )}
                        </g>
                    );
                })()}

            </g>
        </svg>
    );
};

export default OverlayLayer;
