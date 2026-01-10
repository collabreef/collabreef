import { useCallback, useEffect, useRef, useState } from 'react';
import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, ViewObjectType } from '../../../types/view';
import { useTranslation } from 'react-i18next';
import WhiteboardToolbar, { Tool } from './WhiteboardToolbar';
import AddElementDialog from './AddElementDialog';
import { useWhiteboardWebSocket } from '../../../hooks/use-whiteboard-websocket';

interface WhiteboardViewComponentProps {
    view?: any;
    isPublic?: boolean;
    workspaceId?: string;
    viewId?: string;
}

interface CanvasObject {
    id: string;
    type: 'stroke' | 'shape';
    data: WhiteboardStrokeData | WhiteboardShapeData;
}

interface WhiteboardObject {
    id: string;
    type: ViewObjectType;
    name: string;
    data: WhiteboardTextData | any;
}

const WhiteboardViewComponent = ({
    isPublic = false,
    workspaceId,
    viewId
}: WhiteboardViewComponentProps) => {
    const { t } = useTranslation();

    // WebSocket integration for real-time sync
    const {
        sendUpdate,
        isConnected,
        onlineUsers,
        canvasObjects: remoteCanvasObjects,
        viewObjects: remoteViewObjects
    } = useWhiteboardWebSocket({
        viewId: viewId || '',
        workspaceId: workspaceId || '',
        enabled: !!viewId && (isPublic || !!workspaceId),
        isPublic: isPublic,
    });

    // Canvas ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Canvas state (strokes and shapes)
    const [canvasObjects, setCanvasObjects] = useState<Map<string, CanvasObject>>(new Map());

    // View objects state (text, notes, views)
    const [viewObjects, setViewObjects] = useState<Map<string, WhiteboardObject>>(new Map());

    // Drawing state
    const [currentTool, setCurrentTool] = useState<Tool>('select');
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [isDraggingObject, setIsDraggingObject] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

    // Current drawing data
    const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

    // Viewport state
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Dialog state
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [isAddingView, setIsAddingView] = useState(false);

    // Canvas size
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Sync remote updates to local state
    useEffect(() => {
        if (remoteCanvasObjects) {
            setCanvasObjects(new Map(remoteCanvasObjects));
        }
    }, [remoteCanvasObjects]);

    useEffect(() => {
        if (remoteViewObjects) {
            setViewObjects(new Map(remoteViewObjects));
        }
    }, [remoteViewObjects]);

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

            if (obj.type === 'stroke') {
                renderStroke(ctx, obj.data as WhiteboardStrokeData, isSelected);
            } else if (obj.type === 'shape') {
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

    // Get pointer position (works for both mouse and touch)
    const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
        let clientX: number, clientY: number;

        if ('touches' in e) {
            // For touch events, use changedTouches when touches is empty (on touchend)
            const touch = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
            if (!touch) return null;
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return screenToCanvas(clientX, clientY);
    };

    // Event handlers (unified for mouse and touch)
    const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (isPublic) return;

        const pos = getPointerPosition(e);
        if (!pos) return;

        let clientX: number, clientY: number;
        if ('touches' in e) {
            if (e.touches.length === 0) return;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Middle mouse button = pan
        if (e.type === 'mousedown' && (e as React.MouseEvent).button === 1) {
            setIsPanning(true);
            setLastPanPoint({ x: clientX, y: clientY });
            return;
        }

        // Space key pressed = pan mode
        if (isSpacePressed) {
            setIsPanning(true);
            setLastPanPoint({ x: clientX, y: clientY });
            return;
        }

        if (currentTool === 'select') {
            const clickedObject = findObjectAtPosition(pos.x, pos.y);
            if (clickedObject) {
                setSelectedObjectId(clickedObject.id);
                setIsDraggingObject(true);

                // Calculate drag offset based on object type
                let objPos = { x: 0, y: 0 };

                if (clickedObject.type === 'canvas') {
                    const canvasObj = canvasObjects.get(clickedObject.id);
                    if (canvasObj) {
                        if (canvasObj.type === 'stroke') {
                            const data = canvasObj.data as WhiteboardStrokeData;
                            const minX = Math.min(...data.points.map(p => p.x));
                            const minY = Math.min(...data.points.map(p => p.y));
                            objPos = { x: minX, y: minY };
                        } else if (canvasObj.type === 'shape') {
                            const data = canvasObj.data as WhiteboardShapeData;
                            objPos = data.position;
                        }
                    }
                } else {
                    const viewObj = viewObjects.get(clickedObject.id);
                    if (viewObj && viewObj.data) {
                        objPos = viewObj.data.position || { x: 0, y: 0 };
                    }
                }

                setDragOffset({
                    x: pos.x - objPos.x,
                    y: pos.y - objPos.y
                });
            } else {
                // Clicked on empty space with select tool = pan canvas
                setIsPanning(true);
                setLastPanPoint({ x: clientX, y: clientY });
                setSelectedObjectId(null);
                setIsDraggingObject(false);
                setDragOffset(null);
            }
        } else if (currentTool === 'pen') {
            setIsDrawing(true);
            setCurrentPoints([pos]);
        } else if (currentTool === 'eraser') {
            setIsDrawing(true);
            // Check if clicking on an object to erase
            const objectToErase = findObjectAtPosition(pos.x, pos.y);
            if (objectToErase) {
                handleEraseObject(objectToErase.id);
            }
        } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
            setIsDrawing(true);
            setStartPoint(pos);
            setCurrentPoints([pos]);
        } else if (currentTool === 'text') {
            const text = prompt(t('whiteboard.enterText') || 'Enter text:');
            if (text) {
                const textData: WhiteboardTextData = {
                    position: pos,
                    text,
                    color: currentColor,
                    fontSize: 24
                };
                const id = generateId();
                const newObject: WhiteboardObject = {
                    id,
                    type: 'whiteboard_text',
                    name: `Text: ${text.substring(0, 20)}`,
                    data: textData
                };

                setViewObjects(prev => new Map(prev).set(id, newObject));
                sendUpdate({ type: 'add_view_object', object: newObject });
            }
        } else if (currentTool === 'note') {
            setIsAddingNote(true);
        } else if (currentTool === 'view') {
            setIsAddingView(true);
        }
    };

    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (isPublic) return;

        const pos = getPointerPosition(e);
        if (!pos) return;

        if (isPanning && lastPanPoint) {
            let clientX: number, clientY: number;
            if ('touches' in e) {
                if (e.touches.length === 0) return;
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const dx = clientX - lastPanPoint.x;
            const dy = clientY - lastPanPoint.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setLastPanPoint({ x: clientX, y: clientY });
        } else if (isDraggingObject && selectedObjectId && dragOffset) {
            // Handle object dragging
            const newPos = {
                x: pos.x - dragOffset.x,
                y: pos.y - dragOffset.y
            };

            // Update object position
            const canvasObj = canvasObjects.get(selectedObjectId);
            const viewObj = viewObjects.get(selectedObjectId);

            if (canvasObj) {
                const updatedObj = { ...canvasObj };

                if (updatedObj.type === 'stroke') {
                    const data = updatedObj.data as WhiteboardStrokeData;
                    const minX = Math.min(...data.points.map(p => p.x));
                    const minY = Math.min(...data.points.map(p => p.y));
                    const dx = newPos.x - minX;
                    const dy = newPos.y - minY;

                    updatedObj.data = {
                        ...data,
                        points: data.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
                    };
                } else if (updatedObj.type === 'shape') {
                    const data = updatedObj.data as WhiteboardShapeData;
                    updatedObj.data = {
                        ...data,
                        position: newPos
                    };
                }

                setCanvasObjects(prev => new Map(prev).set(selectedObjectId, updatedObj));
            } else if (viewObj) {
                const updatedObj = { ...viewObj };
                updatedObj.data = {
                    ...updatedObj.data,
                    position: newPos
                };
                setViewObjects(prev => new Map(prev).set(selectedObjectId, updatedObj));
            }

            render();
        } else if (isDrawing) {
            if (currentTool === 'eraser') {
                // Continuous erasing while moving
                const objectToErase = findObjectAtPosition(pos.x, pos.y);
                if (objectToErase) {
                    handleEraseObject(objectToErase.id);
                }
            } else {
                setCurrentPoints(prev => [...prev, pos]);
            }
            render();
        }
    };

    const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (isPublic) return;

        if (isPanning) {
            setIsPanning(false);
            setLastPanPoint(null);
        } else if (isDraggingObject && selectedObjectId) {
            // Finish dragging - send update to server
            const canvasObj = canvasObjects.get(selectedObjectId);
            const viewObj = viewObjects.get(selectedObjectId);

            if (canvasObj) {
                sendUpdate({
                    type: 'update_canvas_object',
                    object: canvasObj
                });
            } else if (viewObj) {
                sendUpdate({
                    type: 'update_view_object',
                    object: viewObj
                });
            }

            setIsDraggingObject(false);
            setDragOffset(null);
        } else if (isDrawing) {
            const pos = getPointerPosition(e);
            if (!pos) {
                setIsDrawing(false);
                setCurrentPoints([]);
                setStartPoint(null);
                return;
            }

            if (currentTool === 'pen' && currentPoints.length > 1) {
                const strokeData: WhiteboardStrokeData = {
                    points: currentPoints,
                    color: currentColor,
                    width: currentStrokeWidth
                };
                const id = generateId();
                const newObject: CanvasObject = {
                    id,
                    type: 'stroke',
                    data: strokeData
                };

                setCanvasObjects(prev => new Map(prev).set(id, newObject));
                sendUpdate({ type: 'add_canvas_object', object: newObject });
            } else if (startPoint && (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line')) {
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
                const newObject: CanvasObject = {
                    id,
                    type: 'shape',
                    data: shapeData
                };

                setCanvasObjects(prev => new Map(prev).set(id, newObject));
                sendUpdate({ type: 'add_canvas_object', object: newObject });
            }

            setIsDrawing(false);
            setCurrentPoints([]);
            setStartPoint(null);
        }
    };

    // Handle wheel for zoom
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom + delta));
        setViewport(prev => ({ ...prev, zoom: newZoom }));
    };

    // Handle pinch to zoom and two-finger pan on touch devices
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            // Two finger gesture - start tracking
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            // Calculate initial distance for pinch zoom
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            // Calculate midpoint for pan
            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            setLastPanPoint({ x: distance, y: midY });
            // Store midpoint in a separate state or use existing mechanism
            (e.currentTarget as any).twoFingerMidpoint = { x: midX, y: midY };
        } else {
            // Single finger touch - prevent default to avoid scrolling when drawing
            if (currentTool === 'pen' || currentTool === 'eraser' ||
                currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
                e.preventDefault();
            }
            handlePointerDown(e);
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            // Two finger gesture - pinch zoom and pan
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            // Calculate current distance for pinch zoom
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            // Calculate current midpoint for pan
            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            if (lastPanPoint) {
                // Handle pinch zoom
                const scale = distance / lastPanPoint.x;
                const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * scale));

                // Handle two-finger pan
                const prevMidpoint = (e.currentTarget as any).twoFingerMidpoint || { x: midX, y: midY };
                const dx = midX - prevMidpoint.x;
                const dy = midY - prevMidpoint.y;

                setViewport(prev => ({
                    ...prev,
                    zoom: newZoom,
                    x: prev.x + dx,
                    y: prev.y + dy
                }));

                setLastPanPoint({ x: distance, y: midY });
                (e.currentTarget as any).twoFingerMidpoint = { x: midX, y: midY };
            }
        } else {
            // Single finger touch - prevent default when drawing or dragging
            if (isDrawing || isDraggingObject || isPanning) {
                e.preventDefault();
            }
            handlePointerMove(e);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length < 2) {
            setLastPanPoint(null);
            delete (e.currentTarget as any).twoFingerMidpoint;
        }
        if (e.touches.length === 0) {
            // Prevent default when finishing drawing or dragging
            if (isDrawing || isDraggingObject || isPanning) {
                e.preventDefault();
            }
            handlePointerUp(e);
        }
    };

    const findObjectAtPosition = (x: number, y: number): { id: string; type: 'canvas' | 'view' } | null => {
        // Check view objects first (on top)
        for (const [id, obj] of Array.from(viewObjects.entries()).reverse()) {
            try {
                const data = obj.data;

                if (obj.type === 'whiteboard_text') {
                    const textData = data as WhiteboardTextData;
                    const canvas = canvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (ctx) {
                        ctx.font = `${textData.fontSize}px sans-serif`;
                        const metrics = ctx.measureText(textData.text);
                        if (x >= textData.position.x - 5 && x <= textData.position.x + metrics.width + 5 &&
                            y >= textData.position.y - textData.fontSize - 5 && y <= textData.position.y + 5) {
                            return { id, type: 'view' };
                        }
                    }
                } else if (obj.type === 'whiteboard_note' || obj.type === 'whiteboard_view') {
                    const posData = data as any;
                    const width = posData.width || 200;
                    const height = posData.height || 150;
                    if (x >= posData.position.x && x <= posData.position.x + width &&
                        y >= posData.position.y && y <= posData.position.y + height) {
                        return { id, type: 'view' };
                    }
                }
            } catch (e) {
                console.error('Error checking view object:', e);
            }
        }

        // Check canvas objects
        for (const [id, obj] of Array.from(canvasObjects.entries()).reverse()) {
            try {
                const data = obj.data;

                if (obj.type === 'stroke') {
                    const strokeData = data as WhiteboardStrokeData;
                    const minX = Math.min(...strokeData.points.map(p => p.x));
                    const maxX = Math.max(...strokeData.points.map(p => p.x));
                    const minY = Math.min(...strokeData.points.map(p => p.y));
                    const maxY = Math.max(...strokeData.points.map(p => p.y));
                    if (x >= minX - 5 && x <= maxX + 5 && y >= minY - 5 && y <= maxY + 5) {
                        return { id, type: 'canvas' };
                    }
                } else if (obj.type === 'shape') {
                    const shapeData = data as WhiteboardShapeData;
                    if (shapeData.type === 'rectangle') {
                        if (x >= shapeData.position.x && x <= shapeData.position.x + shapeData.dimensions.width &&
                            y >= shapeData.position.y && y <= shapeData.position.y + shapeData.dimensions.height) {
                            return { id, type: 'canvas' };
                        }
                    }
                }
            } catch (e) {
                console.error('Error checking canvas object:', e);
            }
        }
        return null;
    };

    const handleEraseObject = (objId: string) => {
        const canvasObj = canvasObjects.get(objId);
        const viewObj = viewObjects.get(objId);

        if (canvasObj) {
            setCanvasObjects(prev => {
                const newMap = new Map(prev);
                newMap.delete(objId);
                return newMap;
            });
            sendUpdate({ type: 'delete_canvas_object', id: objId });
        } else if (viewObj) {
            setViewObjects(prev => {
                const newMap = new Map(prev);
                newMap.delete(objId);
                return newMap;
            });
            sendUpdate({ type: 'delete_view_object', id: objId });
        }
    };

    const handleClear = () => {
        if (window.confirm(t('whiteboard.clearConfirm') || 'Clear all? This cannot be undone.')) {
            setCanvasObjects(new Map());
            setViewObjects(new Map());
            sendUpdate({ type: 'clear_all' });
        }
    };

    const handleDelete = () => {
        if (!selectedObjectId) return;
        handleEraseObject(selectedObjectId);
        setSelectedObjectId(null);
    };

    // Zoom controls
    const handleZoomIn = () => {
        setViewport(prev => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }));
    };

    const handleZoomOut = () => {
        setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
    };

    const handleResetZoom = () => {
        setViewport({ x: 0, y: 0, zoom: 1 });
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedObjectId) {
                handleDelete();
            } else if (e.key === 'Escape') {
                setSelectedObjectId(null);
            } else if (e.key === ' ' && !isDrawing && !isDraggingObject) {
                e.preventDefault(); // Prevent page scroll
                setIsSpacePressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                setIsSpacePressed(false);
                if (isPanning && !isDraggingObject) {
                    setIsPanning(false);
                    setLastPanPoint(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedObjectId, isDrawing, isDraggingObject, isPanning]);

    return (
        <>
            <div ref={containerRef} className="relative w-full h-full bg-neutral-50 dark:bg-neutral-900">
                {/* Sync status indicator */}
                {!isPublic && (
                    <div className="absolute top-4 right-4 z-10 bg-white dark:bg-neutral-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                            {isConnected ? t('whiteboard.connected') || 'Connected' : t('whiteboard.disconnected') || 'Disconnected'}
                        </span>
                        {onlineUsers > 1 && (
                            <span className="text-xs text-neutral-500">
                                • {onlineUsers} online
                            </span>
                        )}
                    </div>
                )}

                {/* Zoom controls */}
                {!isPublic && (
                    <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-neutral-800 rounded-lg shadow-md p-2 flex flex-col gap-2">
                        <button
                            onClick={handleZoomIn}
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                            title={t('whiteboard.zoomIn') || 'Zoom In'}
                        >
                            +
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-xs font-medium"
                            title={t('whiteboard.resetZoom') || 'Reset Zoom'}
                        >
                            {Math.round(viewport.zoom * 100)}%
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                            title={t('whiteboard.zoomOut') || 'Zoom Out'}
                        >
                            −
                        </button>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    style={{ touchAction: 'none' }}
                    className={`${
                        isPanning || isSpacePressed
                            ? 'cursor-grab active:cursor-grabbing'
                            : isDraggingObject
                            ? 'cursor-move'
                            : 'cursor-crosshair'
                    }`}
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
