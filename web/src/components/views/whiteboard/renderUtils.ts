import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, WhiteboardEdgeData } from '../../../types/view';

// Helper function to render selection handles (4 corner resize + 4 edge connection points)
export const renderSelectionHandles = (
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number },
    viewport: { x: number; y: number; zoom: number },
    showConnectionPoints: boolean = true
) => {
    const zoom = viewport.zoom || 1;
    const handleSize = 8 / zoom;

    // Draw selection border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
    ctx.setLineDash([]);

    // Four corner resize handles (square)
    const corners = [
        { x: bounds.x, y: bounds.y }, // Northwest
        { x: bounds.x + bounds.width, y: bounds.y }, // Northeast
        { x: bounds.x, y: bounds.y + bounds.height }, // Southwest
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Southeast
    ];

    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 / zoom;

    corners.forEach(corner => {
        ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
    });

    // Four edge midpoint connection handles (circle)
    if (showConnectionPoints) {
        const connectionPoints = [
            { x: bounds.x + bounds.width / 2, y: bounds.y }, // Top
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // Bottom
            { x: bounds.x, y: bounds.y + bounds.height / 2 }, // Left
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // Right
        ];

        ctx.fillStyle = '#10b981'; // Green for connection points
        ctx.strokeStyle = '#ffffff';

        connectionPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, handleSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }
};

export const renderStroke = (
    ctx: CanvasRenderingContext2D,
    data: WhiteboardStrokeData,
    isSelected: boolean,
    viewport: { x: number; y: number; zoom: number }
) => {
    // Null checks
    if (!data || !data.points || data.points.length === 0) return;
    if (!viewport) return;

    const color = data.color || '#000000';
    const width = data.width || 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const firstPoint = data.points[0];
    if (!firstPoint || typeof firstPoint.x !== 'number' || typeof firstPoint.y !== 'number') return;

    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (let i = 1; i < data.points.length; i++) {
        const point = data.points[i];
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            ctx.lineTo(point.x, point.y);
        }
    }
    ctx.stroke();

    if (isSelected) {
        const validPoints = data.points.filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
        if (validPoints.length === 0) return;

        const minX = Math.min(...validPoints.map(p => p.x));
        const maxX = Math.max(...validPoints.map(p => p.x));
        const minY = Math.min(...validPoints.map(p => p.y));
        const maxY = Math.max(...validPoints.map(p => p.y));

        renderSelectionHandles(ctx, {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        }, viewport);
    }
};

export const renderShape = (
    ctx: CanvasRenderingContext2D,
    data: WhiteboardShapeData,
    isSelected: boolean,
    viewport: { x: number; y: number; zoom: number }
) => {
    // Null checks
    if (!data || !data.position || !data.dimensions) return;
    if (!viewport) return;
    if (typeof data.position.x !== 'number' || typeof data.position.y !== 'number') return;
    if (typeof data.dimensions.width !== 'number' || typeof data.dimensions.height !== 'number') return;

    const color = data.color || '#000000';
    const strokeWidth = data.strokeWidth || 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;

    if (data.type === 'rectangle') {
        if (data.filled) {
            ctx.fillStyle = color;
            ctx.fillRect(data.position.x, data.position.y, data.dimensions.width, data.dimensions.height);
        }
        ctx.strokeRect(data.position.x, data.position.y, data.dimensions.width, data.dimensions.height);
    } else if (data.type === 'circle') {
        const radius = Math.sqrt(Math.pow(data.dimensions.width, 2) + Math.pow(data.dimensions.height, 2));
        ctx.beginPath();
        ctx.arc(data.position.x, data.position.y, radius, 0, 2 * Math.PI);
        if (data.filled) {
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.stroke();
    } else if (data.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(data.position.x, data.position.y);
        ctx.lineTo(data.position.x + data.dimensions.width, data.position.y + data.dimensions.height);
        ctx.stroke();
    }

    if (isSelected) {
        if (data.type === 'rectangle') {
            renderSelectionHandles(ctx, {
                x: data.position.x,
                y: data.position.y,
                width: data.dimensions.width,
                height: data.dimensions.height
            }, viewport);
        } else if (data.type === 'circle') {
            const radius = Math.sqrt(Math.pow(data.dimensions.width, 2) + Math.pow(data.dimensions.height, 2));
            renderSelectionHandles(ctx, {
                x: data.position.x - radius,
                y: data.position.y - radius,
                width: radius * 2,
                height: radius * 2
            }, viewport);
        } else if (data.type === 'line') {
            // For lines, use bounding box
            const minX = Math.min(data.position.x, data.position.x + data.dimensions.width);
            const maxX = Math.max(data.position.x, data.position.x + data.dimensions.width);
            const minY = Math.min(data.position.y, data.position.y + data.dimensions.height);
            const maxY = Math.max(data.position.y, data.position.y + data.dimensions.height);
            renderSelectionHandles(ctx, {
                x: minX,
                y: minY,
                width: maxX - minX || 10,
                height: maxY - minY || 10
            }, viewport);
        }
    }
};

export const renderText = (
    ctx: CanvasRenderingContext2D,
    data: WhiteboardTextData,
    isSelected: boolean,
    viewport: { x: number; y: number; zoom: number }
) => {
    // Null checks
    if (!data || !data.position) return;
    if (!viewport) return;
    if (typeof data.position.x !== 'number' || typeof data.position.y !== 'number') return;

    const fontSize = data.fontSize || 16;
    const fontFamily = data.fontFamily || 'sans-serif';
    const fontWeight = data.fontWeight || 'normal';
    const fontStyle = data.fontStyle || 'normal';
    const textDecoration = data.textDecoration || 'none';

    // Use placeholder if text is empty
    const displayText = data.text?.trim() || 'Text';
    const isPlaceholder = !data.text?.trim();
    const color = isPlaceholder ? '#9ca3af' : (data.color || '#000000');

    ctx.fillStyle = color;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillText(displayText, data.position.x, data.position.y);

    // Draw underline if enabled (only for actual text, not placeholder)
    if (textDecoration === 'underline' && !isPlaceholder) {
        const metrics = ctx.measureText(displayText);
        ctx.beginPath();
        ctx.moveTo(data.position.x, data.position.y + 2);
        ctx.lineTo(data.position.x + metrics.width, data.position.y + 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, fontSize / 12);
        ctx.stroke();
    }

    if (isSelected) {
        const metrics = ctx.measureText(displayText);
        renderSelectionHandles(ctx, {
            x: data.position.x,
            y: data.position.y - fontSize,
            width: metrics.width,
            height: fontSize
        }, viewport);
    }
};

export const renderNoteOrView = (
    ctx: CanvasRenderingContext2D,
    data: any,
    obj: any,
    isSelected: boolean,
    viewport: { x: number; y: number; zoom: number }
) => {
    // Null checks
    if (!data || !data.position) return;
    if (!obj) return;
    if (!viewport) return;
    if (typeof data.position.x !== 'number' || typeof data.position.y !== 'number') return;

    const width = data.width || 768;
    const height = data.height || 200;

    // Skip rendering background for whiteboard_note (NoteOverlay handles it)
    if (obj.type !== 'whiteboard_note') {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(data.position.x, data.position.y, width, height);

        // Border
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.strokeRect(data.position.x, data.position.y, width, height);
    }

    // Selection highlight for both whiteboard_note and whiteboard_view
    if (isSelected) {
        renderSelectionHandles(ctx, {
            x: data.position.x,
            y: data.position.y,
            width: width,
            height: height
        }, viewport);
    }
};

export const renderGrid = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    viewport: { x: number; y: number; zoom: number }
) => {
    // Null checks
    if (!canvas || !viewport) return;
    if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number') return;

    const zoom = viewport.zoom || 1;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1 / zoom;
    const gridSize = 50;
    const startX = Math.floor(-viewport.x / zoom / gridSize) * gridSize;
    const startY = Math.floor(-viewport.y / zoom / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - viewport.x) / zoom / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - viewport.y) / zoom / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
};

// Helper function to draw arrow head
const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    size: number,
    color: string
) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, size / 2);
    ctx.lineTo(-size, -size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

// Helper function to calculate angle between two points
const getAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.atan2(y2 - y1, x2 - x1);
};

// Render selection box (marquee selection)
export const renderSelectionBox = (
    ctx: CanvasRenderingContext2D,
    selectionBox: { startX: number; startY: number; currentX: number; currentY: number },
    viewport: { x: number; y: number; zoom: number }
) => {
    if (!selectionBox || !viewport) return;

    const zoom = viewport.zoom || 1;
    const x = Math.min(selectionBox.startX, selectionBox.currentX);
    const y = Math.min(selectionBox.startY, selectionBox.currentY);
    const width = Math.abs(selectionBox.currentX - selectionBox.startX);
    const height = Math.abs(selectionBox.currentY - selectionBox.startY);

    // Fill with semi-transparent blue
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(x, y, width, height);

    // Dashed border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
};

export const renderEdge = (
    ctx: CanvasRenderingContext2D,
    data: WhiteboardEdgeData,
    isSelected: boolean,
    viewport: { x: number; y: number; zoom: number }
) => {
    // Null checks
    if (!data || !data.startPoint || !data.endPoint) return;
    if (!viewport) return;
    if (typeof data.startPoint.x !== 'number' || typeof data.startPoint.y !== 'number') return;
    if (typeof data.endPoint.x !== 'number' || typeof data.endPoint.y !== 'number') return;

    const color = data.color || '#000000';
    const strokeWidth = data.strokeWidth || 2;
    const zoom = viewport.zoom || 1;
    const arrowSize = 10;

    const start = data.startPoint;
    const end = data.endPoint;

    // Set line style
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set dash pattern based on lineStyle
    const dashPatterns: Record<string, number[]> = {
        solid: [],
        dashed: [10, 5],
        dotted: [2, 4]
    };
    ctx.setLineDash(dashPatterns[data.lineStyle] || []);

    ctx.beginPath();

    // Draw curve based on curveType
    if (data.curveType === 'straight') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    } else if (data.curveType === 'bezier') {
        // S-curve using quadratic curves
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(midX, start.y, midX, midY);
        ctx.quadraticCurveTo(midX, end.y, end.x, end.y);
    } else if (data.curveType === 'elbow') {
        // Elbow/step connection
        const midX = (start.x + end.x) / 2;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(midX, start.y);
        ctx.lineTo(midX, end.y);
        ctx.lineTo(end.x, end.y);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Calculate angles for arrows based on curve type
    let startAngle: number;
    let endAngle: number;

    if (data.curveType === 'straight') {
        const angle = getAngle(start.x, start.y, end.x, end.y);
        startAngle = angle + Math.PI;
        endAngle = angle;
    } else if (data.curveType === 'bezier') {
        // For bezier, approximate angles at endpoints
        const midX = (start.x + end.x) / 2;
        startAngle = getAngle(start.x, start.y, midX, start.y) + Math.PI;
        endAngle = getAngle(midX, end.y, end.x, end.y);
    } else {
        // For elbow
        const midX = (start.x + end.x) / 2;
        startAngle = start.x < midX ? Math.PI : 0;
        endAngle = end.x > midX ? 0 : Math.PI;
    }

    // Draw arrows
    if (data.arrowType === 'start' || data.arrowType === 'both') {
        drawArrowHead(ctx, start.x, start.y, startAngle, arrowSize, color);
    }
    if (data.arrowType === 'end' || data.arrowType === 'both') {
        drawArrowHead(ctx, end.x, end.y, endAngle, arrowSize, color);
    }

    // Draw selection indicators
    if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);

        // Draw endpoint handles
        const handleSize = 8 / zoom;
        ctx.fillStyle = '#3b82f6';

        // Start point handle
        ctx.beginPath();
        ctx.arc(start.x, start.y, handleSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        // End point handle
        ctx.beginPath();
        ctx.arc(end.x, end.y, handleSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.stroke();

        ctx.setLineDash([]);
    }
};
