import { useCallback, useEffect, useRef, useState } from 'react';
import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, ViewObjectType } from '../../../types/view';
import { useTranslation } from 'react-i18next';
import WhiteboardToolbar, { Tool } from './WhiteboardToolbar';
import AddElementDialog from './AddElementDialog';
import { useYjsView, useYjsMap } from '../../../hooks/use-yjs-view';
import { useYjsSyncStatus, getSyncStatusMessage } from '../../../hooks/use-yjs-sync-status';

interface WhiteboardViewComponentProps {
    view?: any;
    isPublic?: boolean;
    workspaceId?: string;
    viewId?: string;
}

interface WhiteboardObject {
    id: string;
    type: ViewObjectType;
    name: string;
    data: WhiteboardStrokeData | WhiteboardShapeData | WhiteboardTextData;
}

const WhiteboardViewComponent = ({
    isPublic = false,
    workspaceId,
    viewId
}: WhiteboardViewComponentProps) => {
    const { t } = useTranslation();

    // Y.js integration
    const { doc, provider, getMap } = useYjsView({
        viewId: viewId || '',
        workspaceId: workspaceId || '',
        enabled: !isPublic && !!viewId && !!workspaceId,
    });

    const syncStatus = useYjsSyncStatus(provider, doc);

    // Get separate maps for canvas (strokes/shapes) and view objects (text/note/view)
    const canvasMap = getMap('canvas');
    const viewObjectsMap = getMap('viewobjects');

    // Get canvas objects (strokes, shapes) from Y.js Map
    const canvasObjects = useYjsMap<WhiteboardObject>(canvasMap);

    // Get view objects (text, note, view) from Y.js Map
    const viewObjects = useYjsMap<WhiteboardObject>(viewObjectsMap);

    // Canvas ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drawing state
    const [currentTool, setCurrentTool] = useState<Tool>('select');
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    // Current drawing data
    const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

    // Viewport state
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

    // Dialog state
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [isAddingView, setIsAddingView] = useState(false);

    // Canvas size
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Resize canvas to fit container
    useEffect(() => {
        const updateCanvasSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setCanvasSize({ width, height });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (screenX - rect.left - viewport.x) / viewport.zoom,
            y: (screenY - rect.top - viewport.y) / viewport.zoom
        };
    }, [viewport]);

    // Render canvas
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply viewport transform
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);

        // Draw grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1 / viewport.zoom;
        const gridSize = 50;
        const startX = Math.floor(-viewport.x / viewport.zoom / gridSize) * gridSize;
        const startY = Math.floor(-viewport.y / viewport.zoom / gridSize) * gridSize;
        const endX = Math.ceil((canvas.width - viewport.x) / viewport.zoom / gridSize) * gridSize;
        const endY = Math.ceil((canvas.height - viewport.y) / viewport.zoom / gridSize) * gridSize;

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

        // Render canvas objects (strokes, shapes)
        canvasObjects.forEach((obj, objId) => {
            const isSelected = selectedObjectId === objId;

            if (obj.type === 'whiteboard_stroke') {
                renderStroke(ctx, obj.data as WhiteboardStrokeData, isSelected);
            } else if (obj.type === 'whiteboard_shape') {
                renderShape(ctx, obj.data as WhiteboardShapeData, isSelected);
            }
        });

        // Render view objects (text, note, view)
        viewObjects.forEach((obj, objId) => {
            const isSelected = selectedObjectId === objId;

            if (obj.type === 'whiteboard_text') {
                renderText(ctx, obj.data as WhiteboardTextData, isSelected);
            } else if (obj.type === 'whiteboard_note' || obj.type === 'whiteboard_view') {
                renderNoteOrView(ctx, obj.data, obj, isSelected);
            }
        });

        // Render current drawing
        if (isDrawing && currentTool === 'pen' && currentPoints.length > 0) {
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentStrokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
            for (let i = 1; i < currentPoints.length; i++) {
                ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
            }
            ctx.stroke();
        }

        // Render current shape
        if (isDrawing && startPoint && (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line')) {
            const currentPos = currentPoints[currentPoints.length - 1];
            if (currentPos) {
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = currentStrokeWidth;

                if (currentTool === 'rectangle') {
                    const width = currentPos.x - startPoint.x;
                    const height = currentPos.y - startPoint.y;
                    ctx.strokeRect(startPoint.x, startPoint.y, width, height);
                } else if (currentTool === 'circle') {
                    const radius = Math.sqrt(Math.pow(currentPos.x - startPoint.x, 2) + Math.pow(currentPos.y - startPoint.y, 2));
                    ctx.beginPath();
                    ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                } else if (currentTool === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(startPoint.x, startPoint.y);
                    ctx.lineTo(currentPos.x, currentPos.y);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }, [viewport, canvasObjects, viewObjects, isDrawing, currentTool, currentPoints, startPoint, currentColor, currentStrokeWidth, selectedObjectId]);

    // Render functions for different object types
    const renderStroke = (ctx: CanvasRenderingContext2D, data: WhiteboardStrokeData, isSelected: boolean) => {
        if (!data.points || data.points.length === 0) return;

        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(data.points[0].x, data.points[0].y);
        for (let i = 1; i < data.points.length; i++) {
            ctx.lineTo(data.points[i].x, data.points[i].y);
        }
        ctx.stroke();

        if (isSelected) {
            const minX = Math.min(...data.points.map(p => p.x));
            const maxX = Math.max(...data.points.map(p => p.x));
            const minY = Math.min(...data.points.map(p => p.y));
            const maxY = Math.max(...data.points.map(p => p.y));
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / viewport.zoom;
            ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
            ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
            ctx.setLineDash([]);
        }
    };

    const renderShape = (ctx: CanvasRenderingContext2D, data: WhiteboardShapeData, isSelected: boolean) => {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.strokeWidth;

        if (data.type === 'rectangle') {
            if (data.filled) {
                ctx.fillStyle = data.color;
                ctx.fillRect(data.position.x, data.position.y, data.dimensions.width, data.dimensions.height);
            }
            ctx.strokeRect(data.position.x, data.position.y, data.dimensions.width, data.dimensions.height);
        } else if (data.type === 'circle') {
            const radius = Math.sqrt(Math.pow(data.dimensions.width, 2) + Math.pow(data.dimensions.height, 2));
            ctx.beginPath();
            ctx.arc(data.position.x, data.position.y, radius, 0, 2 * Math.PI);
            if (data.filled) {
                ctx.fillStyle = data.color;
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
            ctx.lineWidth = 2 / viewport.zoom;
            ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
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

    const renderText = (ctx: CanvasRenderingContext2D, data: WhiteboardTextData, isSelected: boolean) => {
        ctx.fillStyle = data.color;
        ctx.font = `${data.fontSize}px sans-serif`;
        ctx.fillText(data.text, data.position.x, data.position.y);

        if (isSelected) {
            const metrics = ctx.measureText(data.text);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / viewport.zoom;
            ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
            ctx.strokeRect(data.position.x - 5, data.position.y - data.fontSize - 5, metrics.width + 10, data.fontSize + 10);
            ctx.setLineDash([]);
        }
    };

    const renderNoteOrView = (ctx: CanvasRenderingContext2D, data: any, obj: any, isSelected: boolean) => {
        const width = data.width || 200;
        const height = data.height || 150;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(data.position.x, data.position.y, width, height);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.strokeRect(data.position.x, data.position.y, width, height);

        ctx.fillStyle = '#000000';
        ctx.font = '14px sans-serif';
        ctx.fillText(obj.name || 'Note', data.position.x + 10, data.position.y + 25);

        if (isSelected) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / viewport.zoom;
            ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
            ctx.strokeRect(data.position.x - 5, data.position.y - 5, width + 10, height + 10);
            ctx.setLineDash([]);
        }
    };

    // Re-render when dependencies change
    useEffect(() => {
        render();
    }, [render]);

    // Generate unique ID
    const generateId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Event handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPublic) return;

        const pos = screenToCanvas(e.clientX, e.clientY);

        if (currentTool === 'select') {
            const clickedObject = findObjectAtPosition(pos.x, pos.y);
            if (clickedObject) {
                setSelectedObjectId(clickedObject.id);
            } else {
                setSelectedObjectId(null);
            }
        } else if (currentTool === 'pen') {
            setIsDrawing(true);
            setCurrentPoints([pos]);
        } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
            setIsDrawing(true);
            setStartPoint(pos);
            setCurrentPoints([pos]);
        } else if (currentTool === 'text') {
            const text = prompt(t('whiteboard.enterText') || 'Enter text:');
            if (text && viewObjectsMap) {
                const textData: WhiteboardTextData = {
                    position: pos,
                    text,
                    color: currentColor,
                    fontSize: 24
                };
                const id = generateId();
                viewObjectsMap.set(id, {
                    id,
                    type: 'whiteboard_text',
                    name: `Text: ${text.substring(0, 20)}`,
                    data: textData
                });
            }
        } else if (currentTool === 'note') {
            setIsAddingNote(true);
        } else if (currentTool === 'view') {
            setIsAddingView(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPublic) return;

        const pos = screenToCanvas(e.clientX, e.clientY);

        if (isDragging && lastPanPoint) {
            const dx = e.clientX - lastPanPoint.x;
            const dy = e.clientY - lastPanPoint.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setLastPanPoint({ x: e.clientX, y: e.clientY });
        } else if (isDrawing) {
            setCurrentPoints(prev => [...prev, pos]);
            render();
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPublic) return;

        if (isDragging) {
            setIsDragging(false);
            setLastPanPoint(null);
        } else if (isDrawing) {
            const pos = screenToCanvas(e.clientX, e.clientY);

            if (currentTool === 'pen' && currentPoints.length > 1 && canvasMap) {
                const strokeData: WhiteboardStrokeData = {
                    points: currentPoints,
                    color: currentColor,
                    width: currentStrokeWidth
                };
                const id = generateId();
                canvasMap.set(id, {
                    id,
                    type: 'whiteboard_stroke',
                    name: 'Stroke',
                    data: strokeData
                });
            } else if (startPoint && (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') && canvasMap) {
                const shapeData: WhiteboardShapeData = {
                    type: currentTool as 'rectangle' | 'circle' | 'line',
                    position: startPoint,
                    dimensions: {
                        width: pos.x - startPoint.x,
                        height: pos.y - startPoint.y
                    },
                    color: currentColor,
                    strokeWidth: currentStrokeWidth,
                    filled: false
                };
                const id = generateId();
                canvasMap.set(id, {
                    id,
                    type: 'whiteboard_shape',
                    name: currentTool,
                    data: shapeData
                });
            }

            setIsDrawing(false);
            setCurrentPoints([]);
            setStartPoint(null);
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom + delta));
        setViewport(prev => ({ ...prev, zoom: newZoom }));
    };

    const findObjectAtPosition = (x: number, y: number): WhiteboardObject | null => {
        // Combine canvas and view objects, reverse to check top to bottom
        const allObjects = [
            ...Array.from(viewObjects.values()),  // View objects on top
            ...Array.from(canvasObjects.values()) // Canvas objects below
        ].reverse();

        for (const obj of allObjects) {
            try {
                const data = obj.data;

                if (obj.type === 'whiteboard_stroke') {
                    const strokeData = data as WhiteboardStrokeData;
                    const minX = Math.min(...strokeData.points.map(p => p.x));
                    const maxX = Math.max(...strokeData.points.map(p => p.x));
                    const minY = Math.min(...strokeData.points.map(p => p.y));
                    const maxY = Math.max(...strokeData.points.map(p => p.y));
                    if (x >= minX - 5 && x <= maxX + 5 && y >= minY - 5 && y <= maxY + 5) {
                        return obj;
                    }
                } else if (obj.type === 'whiteboard_shape') {
                    const shapeData = data as WhiteboardShapeData;
                    if (shapeData.type === 'rectangle') {
                        if (x >= shapeData.position.x && x <= shapeData.position.x + shapeData.dimensions.width &&
                            y >= shapeData.position.y && y <= shapeData.position.y + shapeData.dimensions.height) {
                            return obj;
                        }
                    }
                } else if (obj.type === 'whiteboard_text' || obj.type === 'whiteboard_note' || obj.type === 'whiteboard_view') {
                    const posData = data as any;
                    const width = posData.width || 200;
                    const height = posData.height || 150;
                    if (x >= posData.position.x && x <= posData.position.x + width &&
                        y >= posData.position.y && y <= posData.position.y + height) {
                        return obj;
                    }
                }
            } catch (e) {
                console.error('Error checking object:', e);
            }
        }
        return null;
    };

    const handleClear = () => {
        if (window.confirm(t('whiteboard.clearConfirm') || 'Clear all? This cannot be undone.')) {
            // Clear both canvas and view objects
            if (canvasMap) canvasMap.clear();
            if (viewObjectsMap) viewObjectsMap.clear();
        }
    };

    const handleDelete = () => {
        if (!selectedObjectId) return;

        // Find the object in either map
        const canvasObj = canvasObjects.get(selectedObjectId);
        const viewObj = viewObjects.get(selectedObjectId);

        if (canvasObj && canvasMap) {
            // Delete from canvas map (strokes, shapes)
            canvasMap.delete(selectedObjectId);
            setSelectedObjectId(null);
        } else if (viewObj && viewObjectsMap) {
            // Delete from view objects map (text, note, view)
            viewObjectsMap.delete(selectedObjectId);
            setSelectedObjectId(null);
        }
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedObjectId) {
                handleDelete();
            } else if (e.key === 'Escape') {
                setSelectedObjectId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedObjectId, canvasMap, viewObjectsMap]);

    return (
        <>
            <div ref={containerRef} className="relative w-full h-full bg-neutral-50 dark:bg-neutral-900">
                {/* Sync status indicator */}
                {!isPublic && (
                    <div className="absolute top-4 right-4 z-10 bg-white dark:bg-neutral-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                            syncStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                            {getSyncStatusMessage(syncStatus)}
                        </span>
                        {syncStatus.onlineUsers > 1 && (
                            <span className="text-xs text-neutral-500">
                                • {syncStatus.onlineUsers} online
                            </span>
                        )}
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                    className="cursor-crosshair"
                />

                <WhiteboardToolbar
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    currentColor={currentColor}
                    setCurrentColor={setCurrentColor}
                    currentStrokeWidth={currentStrokeWidth}
                    setCurrentStrokeWidth={setCurrentStrokeWidth}
                    onClear={handleClear}
                    isPublic={isPublic}
                />

                {canvasObjects.size === 0 && viewObjects.size === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-neutral-400 dark:text-neutral-500">
                            {t('whiteboard.emptyState') || 'Start drawing or add notes'}
                        </div>
                    </div>
                )}
            </div>

            {!isPublic && workspaceId && viewId && (
                <>
                    <AddElementDialog
                        workspaceId={workspaceId}
                        viewId={viewId}
                        isOpen={isAddingNote}
                        onOpenChange={setIsAddingNote}
                        elementType="note"
                    />
                    <AddElementDialog
                        workspaceId={workspaceId}
                        viewId={viewId}
                        isOpen={isAddingView}
                        onOpenChange={setIsAddingView}
                        elementType="view"
                    />
                </>
            )}
        </>
    );
};

export default WhiteboardViewComponent;
