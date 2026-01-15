import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, WhiteboardNoteData, ViewObjectType } from '../../../types/view';
import { useTranslation } from 'react-i18next';
import WhiteboardToolbar, { Tool } from './WhiteboardToolbar';
import WhiteboardToolProperties from './WhiteboardToolProperties';
import AddElementDialog from './AddElementDialog';
import { useWhiteboardWebSocket } from '../../../hooks/use-whiteboard-websocket';
import NoteOverlay from './NoteOverlay';
import { renderStroke, renderShape, renderText, renderNoteOrView, renderGrid } from './renderUtils';

interface WhiteboardViewComponentProps {
    view?: any;
    isPublic?: boolean;
    workspaceId?: string;
    viewId?: string;
    initialCanvasObjects?: Record<string, any>;
    initialViewObjects?: Record<string, any>;
    disableWebSocket?: boolean;
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
    viewId,
    initialCanvasObjects,
    initialViewObjects,
    disableWebSocket = false
}: WhiteboardViewComponentProps) => {
    const { t } = useTranslation();

    // WebSocket integration for real-time sync (disabled for public explore mode)
    const {
        sendUpdate,
        isConnected,
        canvasObjects: remoteCanvasObjects,
        viewObjects: remoteViewObjects
    } = useWhiteboardWebSocket({
        viewId: viewId || '',
        workspaceId: workspaceId || '',
        enabled: !disableWebSocket && !!viewId && (isPublic || !!workspaceId),
        isPublic: isPublic,
        skipInitialFetch: isPublic && !!(initialCanvasObjects && initialViewObjects),
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
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
    const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);

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

    // Canvas size
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Initialize with API data for public mode
    useEffect(() => {
        if (isPublic && initialCanvasObjects) {
            setCanvasObjects(new Map(Object.entries(initialCanvasObjects)));
        }
    }, [isPublic, initialCanvasObjects]);

    useEffect(() => {
        if (isPublic && initialViewObjects) {
            setViewObjects(new Map(Object.entries(initialViewObjects)));
        }
    }, [isPublic, initialViewObjects]);

    // Sync remote updates to local state (for non-public or real-time updates)
    useEffect(() => {
        if (remoteCanvasObjects) {
            setCanvasObjects(new Map(remoteCanvasObjects));
        }
    }, [remoteCanvasObjects]);

    useEffect(() => {
        if (remoteViewObjects) {
            // Convert ViewObject map to WhiteboardObject map
            const convertedMap = new Map<string, WhiteboardObject>();
            remoteViewObjects.forEach((obj, key) => {
                convertedMap.set(key, {
                    id: obj.id,
                    type: obj.type as ViewObjectType,
                    name: obj.name,
                    data: obj.data
                });
            });
            setViewObjects(convertedMap);
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
        renderGrid(ctx, canvas, viewport);

        // Render canvas objects (strokes, shapes)
        canvasObjects.forEach((obj, objId) => {
            const isSelected = selectedObjectId === objId;

            if (obj.type === 'stroke') {
                renderStroke(ctx, obj.data as WhiteboardStrokeData, isSelected, viewport);
            } else if (obj.type === 'shape') {
                renderShape(ctx, obj.data as WhiteboardShapeData, isSelected, viewport);
            }
        });

        // Render view objects (text, note, view)
        viewObjects.forEach((obj, objId) => {
            const isSelected = selectedObjectId === objId;

            if (obj.type === 'whiteboard_text') {
                renderText(ctx, obj.data as WhiteboardTextData, isSelected, viewport);
            } else if (obj.type === 'whiteboard_note' || obj.type === 'whiteboard_view') {
                renderNoteOrView(ctx, obj.data, obj, isSelected, viewport);
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

        // Middle mouse button = pan (allowed in public mode)
        if (e.type === 'mousedown' && (e as React.MouseEvent).button === 1) {
            setIsPanning(true);
            setLastPanPoint({ x: clientX, y: clientY });
            return;
        }

        // Space key pressed = pan mode (allowed in public mode)
        if (isSpacePressed) {
            setIsPanning(true);
            setLastPanPoint({ x: clientX, y: clientY });
            return;
        }

        // In public mode, only allow panning by clicking on empty space
        if (isPublic) {
            setIsPanning(true);
            setLastPanPoint({ x: clientX, y: clientY });
            return;
        }

        if (currentTool === 'select') {
            const clickedObject = findObjectAtPosition(pos.x, pos.y);
            if (clickedObject) {
                // First check if clicking on a resize handle
                const handle = checkResizeHandle(pos.x, pos.y, clickedObject.id);
                if (handle && clickedObject.type === 'view') {
                    // Start resizing
                    setSelectedObjectId(clickedObject.id);
                    setIsResizing(true);
                    setResizeHandle(handle);
                    const viewObj = viewObjects.get(clickedObject.id);
                    if (viewObj && viewObj.data) {
                        setResizeStartSize({
                            width: viewObj.data.width || 250,
                            height: viewObj.data.height || 200
                        });
                    }
                    setDragOffset({
                        x: pos.x,
                        y: pos.y
                    });
                } else {
                    // Start dragging
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
                }
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
        }
    };

    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        // Allow panning in public mode
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
            return;
        }

        if (isPublic) return;

        const pos = getPointerPosition(e);
        if (!pos) return;

        if (isDraggingObject && selectedObjectId && dragOffset) {
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
        } else if (isResizing && selectedObjectId && dragOffset && resizeHandle && resizeStartSize) {
            // Handle object resizing
            const viewObj = viewObjects.get(selectedObjectId);
            if (viewObj) {
                const dx = pos.x - dragOffset.x;
                const dy = pos.y - dragOffset.y;

                let newWidth = resizeStartSize.width;
                let newHeight = resizeStartSize.height;
                let newPosition = { ...viewObj.data.position };

                // Calculate new size based on which handle is being dragged
                switch (resizeHandle) {
                    case 'se': // Southeast - increase width and height
                        newWidth = Math.max(100, resizeStartSize.width + dx);
                        newHeight = Math.max(100, resizeStartSize.height + dy);
                        break;
                    case 'sw': // Southwest - decrease width, increase height, adjust x
                        newWidth = Math.max(100, resizeStartSize.width - dx);
                        newHeight = Math.max(100, resizeStartSize.height + dy);
                        if (newWidth > 100) {
                            newPosition.x = viewObj.data.position.x + dx;
                        }
                        break;
                    case 'ne': // Northeast - increase width, decrease height, adjust y
                        newWidth = Math.max(100, resizeStartSize.width + dx);
                        newHeight = Math.max(100, resizeStartSize.height - dy);
                        if (newHeight > 100) {
                            newPosition.y = viewObj.data.position.y + dy;
                        }
                        break;
                    case 'nw': // Northwest - decrease both, adjust x and y
                        newWidth = Math.max(100, resizeStartSize.width - dx);
                        newHeight = Math.max(100, resizeStartSize.height - dy);
                        if (newWidth > 100) {
                            newPosition.x = viewObj.data.position.x + dx;
                        }
                        if (newHeight > 100) {
                            newPosition.y = viewObj.data.position.y + dy;
                        }
                        break;
                }

                const updatedObj = { ...viewObj };
                updatedObj.data = {
                    ...updatedObj.data,
                    width: newWidth,
                    height: newHeight,
                    position: newPosition
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
        // Allow ending panning in public mode
        if (isPanning) {
            setIsPanning(false);
            setLastPanPoint(null);
            return;
        }

        if (isPublic) return;

        if (isDraggingObject && selectedObjectId) {
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
        } else if (isResizing && selectedObjectId) {
            // Finish resizing - send update to server
            const viewObj = viewObjects.get(selectedObjectId);

            if (viewObj) {
                sendUpdate({
                    type: 'update_view_object',
                    object: viewObj
                });
            }

            setIsResizing(false);
            setResizeHandle(null);
            setResizeStartSize(null);
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

    // Check if clicking on a resize handle
    const checkResizeHandle = (x: number, y: number, objId: string): 'se' | 'sw' | 'ne' | 'nw' | null => {
        const viewObj = viewObjects.get(objId);
        if (!viewObj || (viewObj.type !== 'whiteboard_note' && viewObj.type !== 'whiteboard_view')) {
            return null;
        }

        const data = viewObj.data;
        const width = data.width || 250;
        const height = data.height || 200;
        const handleSize = 10; // Size of resize handle in canvas units

        // Check each corner
        const corners = [
            { handle: 'se' as const, x: data.position.x + width, y: data.position.y + height }, // Southeast
            { handle: 'sw' as const, x: data.position.x, y: data.position.y + height }, // Southwest
            { handle: 'ne' as const, x: data.position.x + width, y: data.position.y }, // Northeast
            { handle: 'nw' as const, x: data.position.x, y: data.position.y }, // Northwest
        ];

        for (const corner of corners) {
            if (
                x >= corner.x - handleSize &&
                x <= corner.x + handleSize &&
                y >= corner.y - handleSize &&
                y <= corner.y + handleSize
            ) {
                return corner.handle;
            }
        }

        return null;
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

    // Get cursor style based on position
    const getCursor = useCallback(() => {
        if (isResizing) {
            switch (resizeHandle) {
                case 'se': return 'nwse-resize';
                case 'sw': return 'nesw-resize';
                case 'ne': return 'nesw-resize';
                case 'nw': return 'nwse-resize';
                default: return 'default';
            }
        }
        if (isDraggingObject) return 'move';
        if (isPanning || isSpacePressed) return 'grab';
        return 'crosshair';
    }, [isResizing, resizeHandle, isDraggingObject, isPanning, isSpacePressed]);

    // Handle element added from dialog
    const handleElementAdded = useCallback((element: any) => {
        console.log('[Whiteboard] Element added via dialog:', element);

        // Parse data if it's a JSON string
        let parsedData = element.data;
        if (typeof parsedData === 'string') {
            try {
                parsedData = JSON.parse(parsedData);
            } catch (e) {
                console.error('Failed to parse element data:', e);
            }
        }

        // Add to local state
        const newViewObject: WhiteboardObject = {
            id: element.id,
            type: element.type as ViewObjectType,
            name: element.name,
            data: parsedData
        };
        setViewObjects(prev => new Map(prev).set(element.id, newViewObject));

        // Broadcast to other clients via WebSocket
        sendUpdate({ type: 'add_view_object', object: newViewObject });
    }, [sendUpdate]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedObjectId) {
                handleDelete();
            } else if (e.key === 'Escape') {
                setSelectedObjectId(null);
                setIsResizing(false);
                setResizeHandle(null);
                setResizeStartSize(null);
            } else if (e.key === ' ' && !isDrawing && !isDraggingObject && !isResizing) {
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
                    </div>
                )}

                {/* Note overlays */}
                {Array.from(viewObjects.entries()).map(([objId, obj]) => {
                    if (obj.type === 'whiteboard_note') {
                        const noteData = obj.data as WhiteboardNoteData;
                        return (
                            <NoteOverlay
                                key={objId}
                                viewObjectId={objId}
                                position={noteData.position}
                                width={noteData.width || 768}
                                viewport={viewport}
                                workspaceId={workspaceId!}
                                viewId={viewId!}
                                isSelected={selectedObjectId === objId}
                            />
                        );
                    }
                    return null;
                })}

                {/* Zoom controls - always visible */}
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
                    style={{ touchAction: 'none', cursor: getCursor() }}
                />

                <WhiteboardToolbar
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    isPublic={isPublic}
                />

                <WhiteboardToolProperties
                    currentTool={currentTool}
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
                <AddElementDialog
                    workspaceId={workspaceId}
                    viewId={viewId}
                    isOpen={isAddingNote}
                    onOpenChange={setIsAddingNote}
                    onElementAdded={handleElementAdded}
                />
            )}
        </>
    );
};

export default WhiteboardViewComponent;
