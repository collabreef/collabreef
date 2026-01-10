export type ViewType = 'map' | 'calendar' | 'kanban' | 'flow' | 'whiteboard';
export type ViewObjectType = 'calendar_slot' | 'map_marker' | 'kanban_column' | 'flow_node' | 'flow_edge' | 'whiteboard_stroke' | 'whiteboard_shape' | 'whiteboard_text' | 'whiteboard_note' | 'whiteboard_view';

// View data structures
export interface MapViewData {
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

export interface CalendarViewData {
  defaultYear?: number;
  defaultMonth?: number;
}

export interface KanbanViewData {
  // Array of column IDs in order
  columns?: string[];
}

export interface View {
  id: string;
  workspace_id: string;
  name: string;
  type: ViewType;
  data: string;
  visibility?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface CreateViewRequest {
  name: string;
  type: ViewType;
  data?: string;
  visibility?: string;
}

export interface UpdateViewRequest {
  name?: string;
  type?: ViewType;
  data?: string;
}

export interface ViewObject {
  id: string;
  view_id: string;
  name: string;
  type: ViewObjectType;
  data: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface CreateViewObjectRequest {
  name: string;
  type: ViewObjectType;
  data?: string;
}

export interface UpdateViewObjectRequest {
  name?: string;
  type?: ViewObjectType;
  data?: string;
}

export interface ViewObjectWithView {
  view_object: ViewObject;
  view: View;
}

// View object data structures
export interface CalendarSlotData {
  date: string; // YYYY-MM-DD format (start date)
  end_date?: string; // YYYY-MM-DD format (optional, for multi-day events)
  start_time?: string; // HH:MM format (optional, for timed events)
  end_time?: string; // HH:MM format (optional, for timed events)
  is_all_day?: boolean; // true for all-day events, false or undefined for timed events
  color?: string;
}

export interface MapMarkerData {
  lat: number;
  lng: number;
  color?: string;
}

export interface KanbanColumnData {
  color?: string; // Column header color
}

export interface FlowViewData {
  // Array of node and edge IDs in order
  nodes?: string[];
  edges?: string[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface FlowNodeData {
  position: {
    x: number;
    y: number;
  };
  color?: string;
  width?: number;
  height?: number;
}

export type EdgeType = 'smoothstep' | 'step' | 'straight' | 'bezier';
export type MarkerType = 'arrow' | 'arrowclosed';

export interface FlowEdgeData {
  source: string; // source node id
  target: string; // target node id
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
  markerStart?: string; // arrow at start: 'arrow' | 'arrowclosed' | 'none'
  markerEnd?: string; // arrow at end: 'arrow' | 'arrowclosed' | 'none'
  markerStartType?: MarkerType; // arrow type at start
  markerEndType?: MarkerType; // arrow type at end
  strokeDasharray?: string; // dashed line: '5,5' for dashed, undefined for solid
  stroke?: string; // edge color
  edgeType?: EdgeType; // edge curve type
}

// Whiteboard view data
export interface WhiteboardViewData {
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Whiteboard object data structures
export interface WhiteboardStrokeData {
  points: { x: number; y: number }[];  // 路徑點
  color: string;
  width: number;                        // 線條粗細
}

export interface WhiteboardShapeData {
  type: 'rectangle' | 'circle' | 'line';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };  // 對於 line，表示終點
  color: string;
  strokeWidth: number;
  filled?: boolean;  // 是否填充
}

export interface WhiteboardTextData {
  position: { x: number; y: number };
  text: string;
  color: string;
  fontSize: number;
}

export interface WhiteboardNoteData {
  position: { x: number; y: number };
  noteId: string;                       // 連結的 note ID
  width?: number;
  height?: number;
}

export interface WhiteboardViewRefData {
  position: { x: number; y: number };
  viewId: string;                       // 連結的 view ID
  width?: number;
  height?: number;
}