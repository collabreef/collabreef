import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, WhiteboardNoteData, WhiteboardEdgeData, ViewObjectType, ConnectionPointType } from '../../../types/view';
import { useTranslation } from 'react-i18next';
import WhiteboardToolbar from './WhiteboardToolbar';
import WhiteboardToolProperties from './WhiteboardToolProperties';
import AddElementDialog from './AddElementDialog';
import { useWhiteboardWebSocket } from '../../../hooks/use-whiteboard-websocket';
import NoteOverlay from './NoteOverlay';
import { renderStroke, renderShape, renderText, renderNoteOrView, renderGrid, renderEdge, renderSelectionBox } from './renderUtils';
import { Lock, Unlock } from 'lucide-react';

// Import modular tools and utilities
import {
    Tool,
    CanvasObject,
    WhiteboardObject,
    Point
} from './tools/types';
import { useViewport } from './hooks/useViewport';
import { usePenTool } from './tools/usePenTool';
import { useShapeTool } from './tools/useShapeTool';
import { useEdgeTool } from './tools/useEdgeTool';
import { useTextTool } from './tools/useTextTool';
import { useEraserTool } from './tools/useEraserTool';
import { useSelectTool } from './tools/useSelectTool';
import { findObjectAtPosition } from './objects/hitDetection';
import { getObjectBounds, checkResizeHandle, checkConnectionPoint, getConnectionPointPosition, updateConnectedEdges, findNearestConnectionPoint, findObjectsInSelectionBox } from './objects/bounds';

interface WhiteboardViewComponentProps {
    view?: any;
    isPublic?: boolean;
    workspaceId?: string;
    viewId?: string;
    initialCanvasObjects?: Record<string, any>;
    initialViewObjects?: Record<string, any>;
    disableWebSocket?: boolean;
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

    // WebSocket integration for real-time sync
    const {
        sendUpdate,
        isConnected,
        canvasObjects: remoteCanvasObjects,
        viewObjects: remoteViewObjects,
        isInitialized
    } = useWhiteboardWebSocket({
        viewId: viewId || '',
        workspaceId: workspaceId || '',
        enabled: !disableWebSocket && !!viewId && (isPublic || !!workspaceId),
        isPublic: isPublic,
        skipInitialFetch: isPublic && !!(initialCanvasObjects && initialViewObjects),
    });

    // Canvas refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Canvas state
    const [canvasObjects, setCanvasObjects] = useState<Map<string, CanvasObject>>(new Map());
    const [viewObjects, setViewObjects] = useState<Map<string, WhiteboardObject>>(new Map());

    // Tool state
    const [currentTool, setCurrentTool] = useState<Tool>('select');
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);

    // Lock state
    const [isLocked, setIsLocked] = useState(false);

    // Dialog state
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Canvas size
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Viewport hook
    const {
        viewport,
        setViewport,
        isPanning,
        setIsPanning,
        lastPanPoint,
        setLastPanPoint,
        isSpacePressed,
        setIsSpacePressed,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handlePanMove,
        handleWheelZoom
    } = useViewport();

    // Get canvas context
    const getCtx = useCallback(() => {
        return canvasRef.current?.getContext('2d') || null;
    }, []);

    // Screen to canvas coordinate conversion
    const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (screenX - rect.left - viewport.x) / viewport.zoom,
            y: (screenY - rect.top - viewport.y) / viewport.zoom
        };
    }, [viewport]);

    // Tool hooks
    const penTool = usePenTool({
        currentColor,
        currentStrokeWidth,
        setCanvasObjects,
        sendUpdate
    });

    const shapeTool = useShapeTool({
        currentColor,
        currentStrokeWidth,
        setCanvasObjects,
        sendUpdate
    });

    const edgeTool = useEdgeTool({
        currentColor,
        currentStrokeWidth,
        setViewObjects,
        setSelectedObjectId: (id: string | null) => setSelectedObjectIds(id ? [id] : []),
        sendUpdate
    });

    const textTool = useTextTool({
        currentColor,
        defaultText: t('whiteboard.defaultText') || 'Text',
        setViewObjects,
        setSelectedObjectId: (id: string | null) => setSelectedObjectIds(id ? [id] : []),
        sendUpdate
    });

    const eraserTool = useEraserTool({
        canvasObjects,
        setCanvasObjects,
        viewObjects,
        setViewObjects,
        sendUpdate
    });

    const selectTool = useSelectTool({
        canvasObjects,
        setCanvasObjects,
        viewObjects,
        setViewObjects,
        selectedObjectIds,
        setSelectedObjectIds,
        sendUpdate
    });

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

    // Sync remote updates to local state
    useEffect(() => {
        if (remoteCanvasObjects) {
            setCanvasObjects(new Map(remoteCanvasObjects));
        }
    }, [remoteCanvasObjects]);

    useEffect(() => {
        if (remoteViewObjects) {
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
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setCanvasSize({ width, height });
                }
            }
        });

        resizeObserver.observe(container);

        const { width, height } = container.getBoundingClientRect();
        if (width > 0 && height > 0) {
            setCanvasSize({ width, height });
        }

        return () => resizeObserver.disconnect();
    }, [isInitialized]);

    // Render canvas
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);

        // Draw grid
        renderGrid(ctx, canvas, viewport);

        // Render canvas objects
        canvasObjects.forEach((obj, objId) => {
            const isSelected = selectedObjectIds.includes(objId);
            if (obj.type === 'stroke') {
                renderStroke(ctx, obj.data as WhiteboardStrokeData, isSelected, viewport);
            } else if (obj.type === 'shape') {
                renderShape(ctx, obj.data as WhiteboardShapeData, isSelected, viewport);
            }
        });

        // Render view objects
        viewObjects.forEach((obj, objId) => {
            const isSelected = selectedObjectIds.includes(objId);
            if (obj.type === 'whiteboard_text') {
                renderText(ctx, obj.data as WhiteboardTextData, isSelected, viewport);
            } else if (obj.type === 'whiteboard_note' || obj.type === 'whiteboard_view') {
                renderNoteOrView(ctx, obj.data, obj, isSelected, viewport);
            } else if (obj.type === 'whiteboard_edge') {
                renderEdge(ctx, obj.data as WhiteboardEdgeData, isSelected, viewport);
            }
        });

        // Render selection box if selecting
        if (selectTool.isSelecting && selectTool.selectionBox) {
            renderSelectionBox(ctx, selectTool.selectionBox, viewport);
        }

        // Render tool previews
        penTool.renderPreview(ctx);
        shapeTool.renderPreview(ctx, currentTool);
        edgeTool.renderPreview(ctx);

        ctx.restore();
    }, [viewport, canvasObjects, viewObjects, selectedObjectIds, currentTool, penTool, shapeTool, edgeTool, selectTool.isSelecting, selectTool.selectionBox]);

    // Re-render when dependencies change
    useEffect(() => {
        render();
    }, [render]);

    // Get pointer position
    const getPointerPosition = (e: React.MouseEvent | React.TouchEvent): Point | null => {
        let clientX: number, clientY: number;

        if ('touches' in e) {
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

    // Event handlers
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

        // In public mode or locked mode, only allow panning
        if (isPublic || isLocked) {
            setIsPanning(true);
            setLastPanPoint({ x: clientX, y: clientY });
            return;
        }

        const ctx = getCtx();

        if (currentTool === 'select' || currentTool === 'marquee') {
            // Check if Shift key is held for multi-select
            const isShiftKey = 'shiftKey' in e && e.shiftKey;

            // First, check if clicking on the currently selected object's resize handles
            // This is important for shapes like circles where handles are outside the shape
            // Only allow resize when a single object is selected
            if (selectedObjectIds.length === 1) {
                const selectedId = selectedObjectIds[0];
                const handle = checkResizeHandle(pos.x, pos.y, selectedId, canvasObjects, viewObjects, ctx);
                if (handle) {
                    const bounds = getObjectBounds(selectedId, canvasObjects, viewObjects, ctx);
                    if (bounds) {
                        selectTool.startResizing(selectedId, handle, pos, bounds);
                        return;
                    }
                }

                // Check for connection point on selected object
                const connectionPoint = checkConnectionPoint(pos.x, pos.y, selectedId, canvasObjects, viewObjects, ctx);
                if (connectionPoint) {
                    const startPos = getConnectionPointPosition(selectedId, connectionPoint, canvasObjects, viewObjects, ctx);
                    if (startPos) {
                        edgeTool.startDrawing(startPos, selectedId, connectionPoint);
                        return;
                    }
                }
            }

            // Then check for clicking on any object
            const clickedObject = findObjectAtPosition(pos.x, pos.y, canvasObjects, viewObjects, ctx);
            if (clickedObject) {
                // Check for connection point
                const connectionPoint = checkConnectionPoint(pos.x, pos.y, clickedObject.id, canvasObjects, viewObjects, ctx);
                if (connectionPoint) {
                    const startPos = getConnectionPointPosition(clickedObject.id, connectionPoint, canvasObjects, viewObjects, ctx);
                    if (startPos) {
                        setSelectedObjectIds([clickedObject.id]);
                        edgeTool.startDrawing(startPos, clickedObject.id, connectionPoint);
                        return;
                    }
                }

                // Check for resize handle (only if clicking on the same selected object)
                if (selectedObjectIds.includes(clickedObject.id)) {
                    const handle = checkResizeHandle(pos.x, pos.y, clickedObject.id, canvasObjects, viewObjects, ctx);
                    if (handle) {
                        const bounds = getObjectBounds(clickedObject.id, canvasObjects, viewObjects, ctx);
                        if (bounds) {
                            // Only resize if single selection
                            setSelectedObjectIds([clickedObject.id]);
                            selectTool.startResizing(clickedObject.id, handle, pos, bounds);
                            return;
                        }
                    }
                }

                // Select object (Shift+click toggles in selection)
                selectTool.selectObject(clickedObject.id, isShiftKey);

                // Start dragging if object is now selected (or was already selected)
                if (selectedObjectIds.includes(clickedObject.id) || !isShiftKey) {
                    selectTool.startDragging(pos);
                }
            } else {
                // Clicked on empty space - behavior differs between select and marquee tools
                if (currentTool === 'marquee') {
                    // Marquee tool: always start selection box
                    if (!isShiftKey) {
                        selectTool.clearSelection();
                    }
                    selectTool.startSelectionBox(pos);
                } else {
                    // Select tool: pan the canvas
                    setSelectedObjectIds([]);
                    setIsPanning(true);
                    setLastPanPoint({ x: clientX, y: clientY });
                }
            }
        } else if (currentTool === 'pen') {
            penTool.startDrawing(pos);
        } else if (currentTool === 'eraser') {
            eraserTool.startErasing();
            const objectToErase = findObjectAtPosition(pos.x, pos.y, canvasObjects, viewObjects, ctx);
            if (objectToErase) {
                eraserTool.eraseObject(objectToErase.id);
            }
        } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
            shapeTool.startDrawing(pos);
        } else if (currentTool === 'text') {
            textTool.createText(pos);
        } else if (currentTool === 'note') {
            setIsAddingNote(true);
        } else if (currentTool === 'edge') {
            edgeTool.startDrawing(pos);
        }
    };

    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        // Handle panning
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
            handlePanMove(clientX, clientY);
            return;
        }

        if (isPublic || isLocked) return;

        const pos = getPointerPosition(e);
        if (!pos) return;

        const ctx = getCtx();

        if (selectTool.isSelecting) {
            selectTool.updateSelectionBox(pos);
            render();
        } else if (selectTool.isDragging) {
            selectTool.updateDrag(pos);
            // Update connected edges in real-time while dragging for all selected objects
            if (selectedObjectIds.length > 0) {
                const allUpdatedEdges: WhiteboardObject[] = [];
                selectedObjectIds.forEach(objId => {
                    const updatedEdges = updateConnectedEdges(objId, canvasObjects, viewObjects, ctx);
                    allUpdatedEdges.push(...updatedEdges);
                });
                if (allUpdatedEdges.length > 0) {
                    setViewObjects(prev => {
                        const newMap = new Map(prev);
                        allUpdatedEdges.forEach(edge => {
                            newMap.set(edge.id, edge);
                        });
                        return newMap;
                    });
                }
            }
            render();
        } else if (selectTool.isResizing) {
            selectTool.updateResize(pos);
            // Update connected edges in real-time while resizing
            if (selectedObjectIds.length > 0) {
                const allUpdatedEdges: WhiteboardObject[] = [];
                selectedObjectIds.forEach(objId => {
                    const updatedEdges = updateConnectedEdges(objId, canvasObjects, viewObjects, ctx);
                    allUpdatedEdges.push(...updatedEdges);
                });
                if (allUpdatedEdges.length > 0) {
                    setViewObjects(prev => {
                        const newMap = new Map(prev);
                        allUpdatedEdges.forEach(edge => {
                            newMap.set(edge.id, edge);
                        });
                        return newMap;
                    });
                }
            }
            render();
        } else if (edgeTool.isDrawing) {
            // Find nearby connection point to snap to
            const nearestCP = findNearestConnectionPoint(
                pos.x,
                pos.y,
                canvasObjects,
                viewObjects,
                edgeTool.edgeStartObjectId, // Exclude the start object
                ctx
            );
            edgeTool.continueDrawing(pos, nearestCP);
            render();
        } else if (penTool.isDrawing) {
            penTool.continueDrawing(pos);
            render();
        } else if (shapeTool.isDrawing) {
            shapeTool.continueDrawing(pos);
            render();
        } else if (eraserTool.isErasing) {
            const objectToErase = findObjectAtPosition(pos.x, pos.y, canvasObjects, viewObjects, ctx);
            if (objectToErase) {
                eraserTool.eraseObject(objectToErase.id);
            }
        }
    };

    const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (isPanning) {
            setIsPanning(false);
            setLastPanPoint(null);
            return;
        }

        if (isPublic || isLocked) return;

        const pos = getPointerPosition(e);
        const ctx = getCtx();

        if (selectTool.isSelecting) {
            // Finish selection box and select objects within
            if (selectTool.selectionBox) {
                const box = {
                    x: Math.min(selectTool.selectionBox.startX, selectTool.selectionBox.currentX),
                    y: Math.min(selectTool.selectionBox.startY, selectTool.selectionBox.currentY),
                    width: Math.abs(selectTool.selectionBox.currentX - selectTool.selectionBox.startX),
                    height: Math.abs(selectTool.selectionBox.currentY - selectTool.selectionBox.startY)
                };
                const objectsInBox = findObjectsInSelectionBox(box, canvasObjects, viewObjects, ctx);
                selectTool.finishSelectionBox(objectsInBox);
            } else {
                selectTool.finishSelectionBox([]);
            }
            return;
        }

        if (selectTool.isDragging || selectTool.isResizing) {
            // Update connected edges before finishing for all selected objects
            if (selectedObjectIds.length > 0) {
                const allUpdatedEdges: WhiteboardObject[] = [];
                selectedObjectIds.forEach(objId => {
                    const updatedEdges = updateConnectedEdges(objId, canvasObjects, viewObjects, ctx);
                    allUpdatedEdges.push(...updatedEdges);
                });
                if (allUpdatedEdges.length > 0) {
                    setViewObjects(prev => {
                        const newMap = new Map(prev);
                        allUpdatedEdges.forEach(edge => {
                            newMap.set(edge.id, edge);
                        });
                        return newMap;
                    });
                    // Send updates for all modified edges
                    allUpdatedEdges.forEach(edge => {
                        sendUpdate({ type: 'update_view_object', object: edge });
                    });
                }
            }
            selectTool.finishDragOrResize();
        } else if (edgeTool.isDrawing) {
            if (pos) {
                // Use hover target if available, otherwise check for nearby connection point
                let endObjectId: string | null = null;
                let endConnectionPoint: ConnectionPointType | null = null;
                let endPos = pos;

                if (edgeTool.hoverTarget) {
                    // Use the snapped hover target
                    endObjectId = edgeTool.hoverTarget.objectId;
                    endConnectionPoint = edgeTool.hoverTarget.connectionPoint;
                    endPos = edgeTool.hoverTarget.position;
                } else {
                    // Fallback: check if ending on another object's connection point
                    const nearestCP = findNearestConnectionPoint(
                        pos.x,
                        pos.y,
                        canvasObjects,
                        viewObjects,
                        edgeTool.edgeStartObjectId,
                        ctx
                    );
                    if (nearestCP) {
                        endObjectId = nearestCP.objectId;
                        endConnectionPoint = nearestCP.connectionPoint;
                        endPos = nearestCP.position;
                    }
                }

                edgeTool.finishDrawing(endPos, endObjectId, endConnectionPoint);
            } else {
                edgeTool.cancelDrawing();
            }
        } else if (penTool.isDrawing) {
            penTool.finishDrawing();
        } else if (shapeTool.isDrawing) {
            shapeTool.finishDrawing(currentTool);
        } else if (eraserTool.isErasing) {
            eraserTool.finishErasing();
        }
    };

    // Handle wheel for zoom
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        handleWheelZoom(e.deltaY, mouseX, mouseY);
    };

    // Touch handlers for pinch zoom
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                (e.currentTarget as any).pinchZoomCenter = {
                    x: touch1.clientX - rect.left,
                    y: touch1.clientY - rect.top
                };
            }

            setLastPanPoint({ x: distance, y: midY });
            (e.currentTarget as any).twoFingerMidpoint = { x: midX, y: midY };
        } else {
            if (currentTool === 'pen' || currentTool === 'eraser' ||
                currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
                e.preventDefault();
            }
            handlePointerDown(e);
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            if (lastPanPoint) {
                const scale = distance / lastPanPoint.x;
                const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * scale));

                const zoomCenter = (e.currentTarget as any).pinchZoomCenter;
                const prevMidpoint = (e.currentTarget as any).twoFingerMidpoint || { x: midX, y: midY };
                const dx = midX - prevMidpoint.x;
                const dy = midY - prevMidpoint.y;

                setViewport(prev => {
                    let newX = prev.x;
                    let newY = prev.y;
                    if (zoomCenter) {
                        const zoomScale = newZoom / prev.zoom;
                        newX = zoomCenter.x - (zoomCenter.x - prev.x) * zoomScale;
                        newY = zoomCenter.y - (zoomCenter.y - prev.y) * zoomScale;
                    }
                    return {
                        ...prev,
                        zoom: newZoom,
                        x: newX + dx,
                        y: newY + dy
                    };
                });

                setLastPanPoint({ x: distance, y: midY });
                (e.currentTarget as any).twoFingerMidpoint = { x: midX, y: midY };
            }
        } else {
            if (penTool.isDrawing || selectTool.isDragging || isPanning) {
                e.preventDefault();
            }
            handlePointerMove(e);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length < 2) {
            setLastPanPoint(null);
            delete (e.currentTarget as any).twoFingerMidpoint;
            delete (e.currentTarget as any).pinchZoomCenter;
        }
        if (e.touches.length === 0) {
            if (penTool.isDrawing || selectTool.isDragging || isPanning) {
                e.preventDefault();
            }
            handlePointerUp(e);
        }
    };

    // Clear all
    const handleClear = () => {
        if (window.confirm(t('whiteboard.clearConfirm') || 'Clear all? This cannot be undone.')) {
            setCanvasObjects(new Map());
            setViewObjects(new Map());
            sendUpdate({ type: 'clear_all' });
        }
    };

    // Delete selected (supports multi-selection)
    const handleDelete = () => {
        if (selectedObjectIds.length === 0) return;
        selectedObjectIds.forEach(id => {
            eraserTool.eraseObject(id);
        });
        setSelectedObjectIds([]);
    };

    // Handle text property updates (applies to first selected text object)
    const handleTextPropertyUpdate = useCallback((updates: Partial<WhiteboardTextData>) => {
        if (selectedObjectIds.length === 0) return;
        // Find first selected text object
        for (const id of selectedObjectIds) {
            const viewObj = viewObjects.get(id);
            if (viewObj && viewObj.type === 'whiteboard_text') {
                textTool.updateText(id, updates, viewObjects);
                break;
            }
        }
    }, [selectedObjectIds, viewObjects, textTool]);

    // Get selected text data (returns first selected text object)
    const getSelectedTextData = useCallback((): WhiteboardTextData | null => {
        if (selectedObjectIds.length === 0) return null;
        for (const id of selectedObjectIds) {
            const viewObj = viewObjects.get(id);
            if (viewObj && viewObj.type === 'whiteboard_text') {
                return viewObj.data as WhiteboardTextData;
            }
        }
        return null;
    }, [selectedObjectIds, viewObjects]);

    // Handle edge property updates (applies to first selected edge object)
    const handleEdgePropertyUpdate = useCallback((updates: Partial<WhiteboardEdgeData>) => {
        if (selectedObjectIds.length === 0) return;

        for (const id of selectedObjectIds) {
            const viewObj = viewObjects.get(id);
            if (viewObj && viewObj.type === 'whiteboard_edge') {
                const updatedObj = {
                    ...viewObj,
                    data: {
                        ...viewObj.data,
                        ...updates
                    }
                };
                setViewObjects(prev => new Map(prev).set(id, updatedObj));
                sendUpdate({ type: 'update_view_object', object: updatedObj });
                break;
            }
        }
    }, [selectedObjectIds, viewObjects, sendUpdate]);

    // Get selected edge data (returns first selected edge object)
    const getSelectedEdgeData = useCallback((): WhiteboardEdgeData | null => {
        if (selectedObjectIds.length === 0) return null;
        for (const id of selectedObjectIds) {
            const viewObj = viewObjects.get(id);
            if (viewObj && viewObj.type === 'whiteboard_edge') {
                return viewObj.data as WhiteboardEdgeData;
            }
        }
        return null;
    }, [selectedObjectIds, viewObjects]);

    // Get cursor style
    const getCursor = useCallback(() => {
        if (selectTool.isResizing) {
            switch (selectTool.resizeHandle) {
                case 'se': return 'nwse-resize';
                case 'sw': return 'nesw-resize';
                case 'ne': return 'nesw-resize';
                case 'nw': return 'nwse-resize';
                default: return 'default';
            }
        }
        if (selectTool.isDragging) return 'move';
        if (isPanning || isSpacePressed) return 'grab';
        return 'crosshair';
    }, [selectTool.isResizing, selectTool.resizeHandle, selectTool.isDragging, isPanning, isSpacePressed]);

    // Handle element added from dialog
    const handleElementAdded = useCallback((element: any) => {
        let parsedData = element.data;
        if (typeof parsedData === 'string') {
            try {
                parsedData = JSON.parse(parsedData);
            } catch (e) {
                console.error('Failed to parse element data:', e);
            }
        }

        const newViewObject: WhiteboardObject = {
            id: element.id,
            type: element.type as ViewObjectType,
            name: element.name,
            data: parsedData
        };
        setViewObjects(prev => new Map(prev).set(element.id, newViewObject));
        sendUpdate({ type: 'add_view_object', object: newViewObject });
    }, [sendUpdate]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedObjectIds.length > 0) {
                handleDelete();
            } else if (e.key === 'Escape') {
                setSelectedObjectIds([]);
            } else if (e.key === ' ' && !penTool.isDrawing && !selectTool.isDragging && !selectTool.isResizing) {
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                setIsSpacePressed(false);
                if (isPanning && !selectTool.isDragging) {
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
    }, [selectedObjectIds, penTool.isDrawing, selectTool.isDragging, selectTool.isResizing, isPanning]);

    // Determine loading state
    const shouldShowLoading = !disableWebSocket && !isInitialized && !(isPublic && initialCanvasObjects && initialViewObjects);

    if (shouldShowLoading) {
        return (
            <div className="relative w-full h-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-neutral-300 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('whiteboard.loading') || 'Loading whiteboard...'}
                    </span>
                </div>
            </div>
        );
    }

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
                                workspaceId={workspaceId}
                                viewId={viewId!}
                                isSelected={selectedObjectIds.includes(objId)}
                                isPublic={isPublic}
                            />
                        );
                    }
                    return null;
                })}

                {/* Zoom controls and lock button */}
                <div className="absolute bottom-24 sm:bottom-4 right-4 z-10 bg-white dark:bg-neutral-800 rounded-lg shadow-md p-2 flex flex-col gap-2">
                    {!isPublic && (
                        <>
                            <button
                                onClick={() => setIsLocked(!isLocked)}
                                className={`p-2 rounded transition-colors flex justify-center ${
                                    isLocked
                                        ? 'bg-primary text-white'
                                        : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                }`}
                                title={isLocked ? (t('whiteboard.unlock') || 'Unlock') : (t('whiteboard.lock') || 'Lock')}
                            >
                                {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                            </button>
                            <div className="border-t border-neutral-200 dark:border-neutral-600 my-1" />
                        </>
                    )}
                    <button
                        onClick={handleZoomIn}
                        className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                        title={t('whiteboard.zoomIn') || 'Zoom In'}
                    >
                        +
                    </button>
                    <button
                        onClick={handleResetZoom}
                        className="p-1 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-xs font-medium"
                        title={t('whiteboard.resetZoom') || 'Reset Zoom'}
                    >
                        {Math.round(viewport.zoom * 100)}%
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
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

                {/* Hide toolbar and tool properties when locked */}
                {!isLocked && (
                    <>
                        <WhiteboardToolbar
                            currentTool={currentTool}
                            setCurrentTool={setCurrentTool}
                            isPublic={isPublic}
                            onClear={handleClear}
                        />

                        <WhiteboardToolProperties
                            currentTool={currentTool}
                            currentColor={currentColor}
                            setCurrentColor={setCurrentColor}
                            currentStrokeWidth={currentStrokeWidth}
                            setCurrentStrokeWidth={setCurrentStrokeWidth}
                            isPublic={isPublic}
                            selectedTextData={getSelectedTextData()}
                            onTextUpdate={handleTextPropertyUpdate}
                            selectedEdgeData={getSelectedEdgeData()}
                            onEdgeUpdate={handleEdgePropertyUpdate}
                        />
                    </>
                )}

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
