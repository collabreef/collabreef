import { WhiteboardStrokeData, WhiteboardShapeData, WhiteboardTextData, WhiteboardEdgeData, WhiteboardNoteData, ViewObjectType } from '../../../../types/view';

export type Tool = 'select' | 'marquee' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'note' | 'edge';

export interface CanvasObject {
    id: string;
    type: 'stroke' | 'shape';
    data: WhiteboardStrokeData | WhiteboardShapeData;
}

export interface WhiteboardObject {
    id: string;
    type: ViewObjectType;
    name: string;
    data: WhiteboardTextData | WhiteboardEdgeData | WhiteboardNoteData | any;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type ResizeHandle = 'se' | 'sw' | 'ne' | 'nw';
export type ConnectionPoint = 'top' | 'bottom' | 'left' | 'right';

export interface ToolContext {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    viewport: Viewport;
    setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
    canvasObjects: Map<string, CanvasObject>;
    setCanvasObjects: React.Dispatch<React.SetStateAction<Map<string, CanvasObject>>>;
    viewObjects: Map<string, WhiteboardObject>;
    setViewObjects: React.Dispatch<React.SetStateAction<Map<string, WhiteboardObject>>>;
    currentColor: string;
    currentStrokeWidth: number;
    selectedObjectId: string | null;
    setSelectedObjectId: React.Dispatch<React.SetStateAction<string | null>>;
    sendUpdate: (update: any) => void;
    screenToCanvas: (screenX: number, screenY: number) => Point;
    render: () => void;
}

export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
