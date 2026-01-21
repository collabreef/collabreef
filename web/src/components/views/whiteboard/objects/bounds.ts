import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, WhiteboardEdgeData, ConnectionPointType } from '../../../../types/view';
import { CanvasObject, WhiteboardObject, Bounds, Point, ConnectionPoint } from '../tools/types';

/**
 * Get the bounding box of any whiteboard object
 */
export const getObjectBounds = (
    objId: string,
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): Bounds | null => {
    // Check canvas objects
    const canvasObj = canvasObjects.get(objId);
    if (canvasObj) {
        if (canvasObj.type === 'stroke') {
            const data = canvasObj.data as WhiteboardStrokeData;
            const validPoints = data.points.filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
            if (validPoints.length === 0) return null;
            const minX = Math.min(...validPoints.map(p => p.x));
            const maxX = Math.max(...validPoints.map(p => p.x));
            const minY = Math.min(...validPoints.map(p => p.y));
            const maxY = Math.max(...validPoints.map(p => p.y));
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        } else if (canvasObj.type === 'shape') {
            const data = canvasObj.data as WhiteboardShapeData;
            if (data.type === 'rectangle') {
                return { x: data.position.x, y: data.position.y, width: data.dimensions.width, height: data.dimensions.height };
            } else if (data.type === 'circle') {
                const radius = Math.sqrt(Math.pow(data.dimensions.width, 2) + Math.pow(data.dimensions.height, 2));
                return { x: data.position.x - radius, y: data.position.y - radius, width: radius * 2, height: radius * 2 };
            } else if (data.type === 'line') {
                const minX = Math.min(data.position.x, data.position.x + data.dimensions.width);
                const maxX = Math.max(data.position.x, data.position.x + data.dimensions.width);
                const minY = Math.min(data.position.y, data.position.y + data.dimensions.height);
                const maxY = Math.max(data.position.y, data.position.y + data.dimensions.height);
                return { x: minX, y: minY, width: maxX - minX || 10, height: maxY - minY || 10 };
            }
        }
    }

    // Check view objects
    const viewObj = viewObjects.get(objId);
    if (viewObj) {
        const data = viewObj.data;
        if (viewObj.type === 'whiteboard_text') {
            const textData = data as WhiteboardTextData;
            if (ctx) {
                const fontStyle = textData.fontStyle || 'normal';
                const fontWeight = textData.fontWeight || 'normal';
                const fontFamily = textData.fontFamily || 'sans-serif';
                const fontSize = textData.fontSize || 16;
                const displayText = textData.text?.trim() || 'Text';
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                const metrics = ctx.measureText(displayText);
                return { x: textData.position.x, y: textData.position.y - fontSize, width: metrics.width, height: fontSize };
            }
        } else if (viewObj.type === 'whiteboard_note' || viewObj.type === 'whiteboard_view') {
            const width = data.width || 768;
            const height = data.height || 200;
            return { x: data.position.x, y: data.position.y, width, height };
        } else if (viewObj.type === 'whiteboard_edge') {
            // Edges don't have resize handles
            return null;
        }
    }

    return null;
};

/**
 * Check if clicking on a resize handle
 */
export const checkResizeHandle = (
    x: number,
    y: number,
    objId: string,
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): 'se' | 'sw' | 'ne' | 'nw' | null => {
    const bounds = getObjectBounds(objId, canvasObjects, viewObjects, ctx);
    if (!bounds) return null;

    const handleSize = 10; // Size of resize handle in canvas units

    // Check each corner
    const corners = [
        { handle: 'se' as const, x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { handle: 'sw' as const, x: bounds.x, y: bounds.y + bounds.height },
        { handle: 'ne' as const, x: bounds.x + bounds.width, y: bounds.y },
        { handle: 'nw' as const, x: bounds.x, y: bounds.y },
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

/**
 * Check if clicking on a connection point
 */
export const checkConnectionPoint = (
    x: number,
    y: number,
    objId: string,
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): ConnectionPoint | null => {
    const bounds = getObjectBounds(objId, canvasObjects, viewObjects, ctx);
    if (!bounds) return null;

    const handleSize = 10;

    // Connection points at edge midpoints
    const connectionPoints = [
        { point: 'top' as const, x: bounds.x + bounds.width / 2, y: bounds.y },
        { point: 'bottom' as const, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
        { point: 'left' as const, x: bounds.x, y: bounds.y + bounds.height / 2 },
        { point: 'right' as const, x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    ];

    for (const cp of connectionPoints) {
        const dist = Math.sqrt(Math.pow(x - cp.x, 2) + Math.pow(y - cp.y, 2));
        if (dist <= handleSize) {
            return cp.point;
        }
    }

    return null;
};

/**
 * Get connection point position for an object
 */
export const getConnectionPointPosition = (
    objId: string,
    point: ConnectionPoint,
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): Point | null => {
    const bounds = getObjectBounds(objId, canvasObjects, viewObjects, ctx);
    if (!bounds) return null;

    switch (point) {
        case 'top': return { x: bounds.x + bounds.width / 2, y: bounds.y };
        case 'bottom': return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height };
        case 'left': return { x: bounds.x, y: bounds.y + bounds.height / 2 };
        case 'right': return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };
    }
};

/**
 * Check if an object's bounds intersects with a selection rectangle
 */
export const isObjectInSelectionBox = (
    objId: string,
    selectionBox: { x: number; y: number; width: number; height: number },
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): boolean => {
    const bounds = getObjectBounds(objId, canvasObjects, viewObjects, ctx);
    if (!bounds) return false;

    // Normalize selection box (handle negative width/height)
    const selX = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x;
    const selY = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y;
    const selW = Math.abs(selectionBox.width);
    const selH = Math.abs(selectionBox.height);

    // Check if bounds intersects with selection box
    return !(
        bounds.x + bounds.width < selX ||
        bounds.x > selX + selW ||
        bounds.y + bounds.height < selY ||
        bounds.y > selY + selH
    );
};

/**
 * Find all objects within a selection box
 */
export const findObjectsInSelectionBox = (
    selectionBox: { x: number; y: number; width: number; height: number },
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): string[] => {
    const selectedIds: string[] = [];

    // Check canvas objects
    canvasObjects.forEach((_, objId) => {
        if (isObjectInSelectionBox(objId, selectionBox, canvasObjects, viewObjects, ctx)) {
            selectedIds.push(objId);
        }
    });

    // Check view objects (excluding edges)
    viewObjects.forEach((obj, objId) => {
        if (obj.type === 'whiteboard_edge') return;
        if (isObjectInSelectionBox(objId, selectionBox, canvasObjects, viewObjects, ctx)) {
            selectedIds.push(objId);
        }
    });

    return selectedIds;
};

/**
 * Find the nearest connection point to a given position across all objects
 */
export const findNearestConnectionPoint = (
    x: number,
    y: number,
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    excludeObjectId: string | null,
    ctx?: CanvasRenderingContext2D | null,
    maxDistance: number = 30
): { objectId: string; connectionPoint: ConnectionPointType; position: Point } | null => {
    let nearest: { objectId: string; connectionPoint: ConnectionPointType; position: Point; distance: number } | null = null;

    const connectionPointTypes: ConnectionPointType[] = ['top', 'bottom', 'left', 'right'];

    // Check canvas objects
    canvasObjects.forEach((_, objId) => {
        if (objId === excludeObjectId) return;

        const bounds = getObjectBounds(objId, canvasObjects, viewObjects, ctx);
        if (!bounds) return;

        connectionPointTypes.forEach(cpType => {
            const cpPos = getConnectionPointPosition(objId, cpType, canvasObjects, viewObjects, ctx);
            if (!cpPos) return;

            const dist = Math.sqrt(Math.pow(x - cpPos.x, 2) + Math.pow(y - cpPos.y, 2));
            if (dist <= maxDistance && (!nearest || dist < nearest.distance)) {
                nearest = { objectId: objId, connectionPoint: cpType, position: cpPos, distance: dist };
            }
        });
    });

    // Check view objects (excluding edges)
    viewObjects.forEach((obj, objId) => {
        if (objId === excludeObjectId) return;
        if (obj.type === 'whiteboard_edge') return;

        const bounds = getObjectBounds(objId, canvasObjects, viewObjects, ctx);
        if (!bounds) return;

        connectionPointTypes.forEach(cpType => {
            const cpPos = getConnectionPointPosition(objId, cpType, canvasObjects, viewObjects, ctx);
            if (!cpPos) return;

            const dist = Math.sqrt(Math.pow(x - cpPos.x, 2) + Math.pow(y - cpPos.y, 2));
            if (dist <= maxDistance && (!nearest || dist < nearest.distance)) {
                nearest = { objectId: objId, connectionPoint: cpType, position: cpPos, distance: dist };
            }
        });
    });

    if (nearest !== null) {
        // Type assertion needed because TypeScript can't track assignments inside forEach callbacks
        const result = nearest as { objectId: string; connectionPoint: ConnectionPointType; position: Point; distance: number };
        return { objectId: result.objectId, connectionPoint: result.connectionPoint, position: result.position };
    }
    return null;
};

/**
 * Update all edges connected to a specific object
 * Returns the updated edges that need to be synced
 */
export const updateConnectedEdges = (
    movedObjectId: string,
    canvasObjects: Map<string, CanvasObject>,
    viewObjects: Map<string, WhiteboardObject>,
    ctx?: CanvasRenderingContext2D | null
): WhiteboardObject[] => {
    const updatedEdges: WhiteboardObject[] = [];

    viewObjects.forEach((obj) => {
        if (obj.type !== 'whiteboard_edge') return;

        const edgeData = obj.data as WhiteboardEdgeData;
        let needsUpdate = false;
        let newStartPoint = edgeData.startPoint;
        let newEndPoint = edgeData.endPoint;

        // Check if start is connected to the moved object
        if (edgeData.startObjectId === movedObjectId && edgeData.startConnectionPoint) {
            const newPos = getConnectionPointPosition(
                movedObjectId,
                edgeData.startConnectionPoint,
                canvasObjects,
                viewObjects,
                ctx
            );
            if (newPos) {
                newStartPoint = newPos;
                needsUpdate = true;
            }
        }

        // Check if end is connected to the moved object
        if (edgeData.endObjectId === movedObjectId && edgeData.endConnectionPoint) {
            const newPos = getConnectionPointPosition(
                movedObjectId,
                edgeData.endConnectionPoint,
                canvasObjects,
                viewObjects,
                ctx
            );
            if (newPos) {
                newEndPoint = newPos;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            const updatedEdge: WhiteboardObject = {
                ...obj,
                data: {
                    ...edgeData,
                    startPoint: newStartPoint,
                    endPoint: newEndPoint
                }
            };
            updatedEdges.push(updatedEdge);
        }
    });

    return updatedEdges;
};
