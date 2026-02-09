export type ViewType = 'map' | 'calendar' | 'kanban' | 'whiteboard' | 'spreadsheet';
export type ViewObjectType = 'calendar_slot' | 'map_marker' | 'kanban_column' | 'whiteboard_stroke' | 'whiteboard_shape' | 'whiteboard_text' | 'whiteboard_note' | 'whiteboard_view' | 'whiteboard_edge';

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
  fontFamily?: 'sans-serif' | 'serif' | 'monospace';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}

export interface WhiteboardNoteData {
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

export interface WhiteboardViewRefData {
  position: { x: number; y: number };
  viewId: string;                       // 連結的 view ID
  width?: number;
  height?: number;
}

export type ConnectionPointType = 'top' | 'bottom' | 'left' | 'right';

export interface WhiteboardEdgeData {
  startObjectId: string | null;  // 連接的起始物件 ID (null 表示自由端點)
  endObjectId: string | null;    // 連接的結束物件 ID (null 表示自由端點)
  startConnectionPoint: ConnectionPointType | null;  // 起始物件的連接點 (top/bottom/left/right)
  endConnectionPoint: ConnectionPointType | null;    // 結束物件的連接點 (top/bottom/left/right)
  startPoint: { x: number; y: number };  // 起始點座標
  endPoint: { x: number; y: number };    // 結束點座標
  curveType: 'straight' | 'bezier' | 'elbow';  // 曲線類型
  arrowType: 'none' | 'end' | 'start' | 'both';  // 箭頭類型
  lineStyle: 'solid' | 'dashed' | 'dotted';  // 線條樣式
  color: string;
  strokeWidth: number;
}

// Spreadsheet view data
export interface SpreadsheetViewData {
  defaultSheet?: string;  // 默認顯示的工作表 ID
  viewport?: {
    scrollLeft: number;
    scrollTop: number;
    zoomRatio: number;
  };
}

// FortuneSheet 單元格數據結構
export interface SpreadsheetCellData {
  v?: string | number | boolean;  // 原始值
  m?: string;                      // 顯示值
  ct?: {                           // 單元格類型
    fa: string;                    // 格式
    t: string;                     // 類型
  };
  bg?: string;                     // 背景色
  fc?: string;                     // 字體顏色
  bl?: number;                     // 粗體
  it?: number;                     // 斜體
  fs?: number;                     // 字體大小
  ff?: string;                     // 字體
  ht?: number;                     // 水平對齊
  vt?: number;                     // 垂直對齊
  mc?: {                           // 合併單元格
    r: number;
    c: number;
    rs: number;
    cs: number;
  };
  f?: string;                      // 公式
}

// FortuneSheet 工作表結構
export interface SpreadsheetSheetData {
  id: string;
  name: string;
  order: number;
  status?: number;
  row?: number;
  column?: number;
  celldata?: Array<{ r: number; c: number; v: SpreadsheetCellData }>;
  config?: {
    merge?: Record<string, { r: number; c: number; rs: number; cs: number }>;
    rowlen?: Record<string, number>;
    columnlen?: Record<string, number>;
    rowhidden?: Record<string, number>;
    colhidden?: Record<string, number>;
    borderInfo?: unknown[];
  };
  frozen?: {
    type?: string;
    range?: { row_focus: number; column_focus: number };
  };
}

// FortuneSheet 操作結構 (用於協作同步)
export interface SpreadsheetOp {
  op: string;
  id: string;         // 工作表 ID
  path: unknown[];    // 變更路徑
  value: unknown;     // 變更值
}