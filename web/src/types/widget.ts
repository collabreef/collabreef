// Widget types
export type WidgetType = 'note_form' | 'stats' | 'template_form' | 'view' | 'note' | 'latest_note' | 'countdown' | 'file_upload';

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

// Latest note widget - for displaying the most recent note
export interface LatestNoteWidgetConfig {
  showMetadata?: boolean; // Show metadata like date and author (default: true)
  showFullContent?: boolean; // Show full content or just title and excerpt (default: false)
  sortBy?: 'created_at' | 'updated_at'; // Sort by created or updated time (default: created_at)
}

// Countdown widget - for displaying countdown timer
export interface CountdownWidgetConfig {
  targetDate: string; // ISO date string
  title?: string; // Title for the countdown
  description?: string; // Description
}

// File upload widget - for uploading files
export interface FileUploadWidgetConfig {
  maxFileSize?: number; // Max file size in MB (default: 10)
  allowedExtensions?: string[]; // Allowed file extensions (empty = all)
  showRecentFiles?: boolean; // Show recently uploaded files (default: true)
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
  latest_note: LatestNoteWidgetConfig;
  countdown: CountdownWidgetConfig;
  file_upload: FileUploadWidgetConfig;
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