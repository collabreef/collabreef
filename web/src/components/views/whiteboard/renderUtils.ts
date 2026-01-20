import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData } from '../../../types/view';

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
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / (viewport.zoom || 1);
        ctx.setLineDash([5 / (viewport.zoom || 1), 5 / (viewport.zoom || 1)]);
        ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
        ctx.setLineDash([]);
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
    const zoom = viewport.zoom || 1;

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
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        if (data.type === 'rectangle') {
            ctx.strokeRect(data.position.x - 5, data.position.y - 5, data.dimensions.width + 10, data.dimensions.height + 10);
        } else if (data.type === 'circle') {
            const radius = Math.sqrt(Math.pow(data.dimensions.width, 2) + Math.pow(data.dimensions.height, 2));
            ctx.beginPath();
            ctx.arc(data.position.x, data.position.y, radius + 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.setLineDash([]);
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
    const zoom = viewport.zoom || 1;

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
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.strokeRect(data.position.x - 5, data.position.y - fontSize - 5, metrics.width + 10, fontSize + 10);
        ctx.setLineDash([]);
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
    const zoom = viewport.zoom || 1;

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

    // Selection highlight (only for whiteboard_view since whiteboard_note has auto height)
    if (isSelected && obj.type === 'whiteboard_view') {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.strokeRect(data.position.x - 5, data.position.y - 5, width + 10, height + 10);
        ctx.setLineDash([]);

        // Draw resize handles for views only
        const handleSize = 8 / zoom;
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;

        // Four corner handles
        const corners = [
            { x: data.position.x, y: data.position.y }, // Northwest
            { x: data.position.x + width, y: data.position.y }, // Northeast
            { x: data.position.x, y: data.position.y + height }, // Southwest
            { x: data.position.x + width, y: data.position.y + height }, // Southeast
        ];

        corners.forEach(corner => {
            if (corner && typeof corner.x === 'number' && typeof corner.y === 'number') {
                ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
            }
        });
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
