// Widget types
export type WidgetType = 'note_form' | 'stats' | 'template_form' | 'view' | 'note';

// Widget position on dashboard
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Base widget interface
export interface Widget {
  id: string;
  workspace_id: string;
  type: WidgetType;
  config: string; // JSON string of widget-specific config
  position: string; // JSON string of WidgetPosition
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// Widget config types for each widget type

// Note form widget - for creating/editing notes
export interface NoteFormWidgetConfig {
  defaultTitle?: string;
  placeholder?: string;
}

// Stats widget - for displaying statistics
export interface StatsWidgetConfig {
  statType: 'note_count' | 'recent_notes' | 'note_by_visibility' | 'custom';
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  customQuery?: string;
}

// Template form widget - for generating content from templates
export interface TemplateFormWidgetConfig {
  templateId: string;
  showHistory?: boolean;
}

// View widget - for displaying a view
export interface ViewWidgetConfig {
  viewId: string;
  showControls?: boolean;
  zoom?: number;
}

// Note widget - for displaying a single note's complete content
export interface NoteWidgetConfig {
  noteId: string;
  showMetadata?: boolean;
}

// Request/Response types
export interface CreateWidgetRequest {
  type: WidgetType;
  config?: string;
  position?: string;
}

export interface UpdateWidgetRequest {
  type?: WidgetType;
  config?: string;
  position?: string;
}

// Helper type to get the config type for a given widget type
export type WidgetConfigMap = {
  note_form: NoteFormWidgetConfig;
  stats: StatsWidgetConfig;
  template_form: TemplateFormWidgetConfig;
  view: ViewWidgetConfig;
  note: NoteWidgetConfig;
};

// Parsed widget with typed config
export interface ParsedWidget<T extends WidgetType = WidgetType> extends Omit<Widget, 'config' | 'position'> {
  config: WidgetConfigMap[T];
  position: WidgetPosition;
}

// Utility functions
export function parseWidgetConfig<T extends WidgetType>(
  widget: Widget
): WidgetConfigMap[T] {
  try {
    return JSON.parse(widget.config || '{}') as WidgetConfigMap[T];
  } catch {
    return {} as WidgetConfigMap[T];
  }
}

export function parseWidgetPosition(widget: Widget): WidgetPosition {
  try {
    return JSON.parse(widget.position || '{}') as WidgetPosition;
  } catch {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
}

export function stringifyWidgetConfig<T extends WidgetType>(
  config: WidgetConfigMap[T]
): string {
  return JSON.stringify(config);
}

export function stringifyWidgetPosition(position: WidgetPosition): string {
  return JSON.stringify(position);
}