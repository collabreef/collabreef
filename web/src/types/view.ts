export type ViewType = 'map' | 'calendar' | 'kanban';
export type ViewObjectType = 'calendar_slot' | 'map_marker' | 'kanban_column';

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
  date: string; // ISO date string
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