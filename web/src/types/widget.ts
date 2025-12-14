// Widget types
export type WidgetType = 'note_form' | 'note' | 'latest_note' | 'countdown' | 'file_upload' | 'carousel' | 'heatmap' | 'rss' | 'music' | 'video' | 'iframe' | 'folder' | 'link' | 'map' | 'calendar';

// Widget position on dashboard
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Base widget interface
export interface Widget {
  id: string;
  workspace_id: string;
  type: WidgetType;
  config: string; // JSON string of widget-specific config
  position: string; // JSON string of WidgetPosition
  parent_id?: string; // Parent widget ID for hierarchical structure (null/undefined for root widgets)
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
  toolbar?: {
    showBold?: boolean;
    showItalic?: boolean;
    showUnderline?: boolean;
    showStrike?: boolean;
    showCode?: boolean;
    showHeading?: boolean;
    showBulletList?: boolean;
    showOrderedList?: boolean;
    showBlockquote?: boolean;
    showCodeBlock?: boolean;
    showLink?: boolean;
    showImage?: boolean;
    showTable?: boolean;
  };
}

// Note widget - for displaying a single note's complete content
export interface NoteWidgetConfig {
  noteId: string;
  showMetadata?: boolean;
}

// Latest note widget - for displaying the most recent note
export interface LatestNoteWidgetConfig {
  showMetadata?: boolean; // Show metadata like date and author (default: true)
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

// Carousel widget - for image carousel
export interface CarouselWidgetConfig {
  imageUrls?: string[]; // Array of image URLs
  autoPlay?: boolean; // Auto play carousel (default: false)
  interval?: number; // Auto play interval in seconds (default: 3)
}

// Heatmap widget - for displaying note creation heatmap
export interface HeatmapWidgetConfig {
  dayCount?: number; // Number of days to show (default: 365)
  showLegend?: boolean; // Show color legend (default: true)
}

// RSS widget - for displaying RSS feeds
export interface RssWidgetConfig {
  feedUrl: string; // RSS feed URL
  maxItems?: number; // Max items to display (default: 10)
  showDescription?: boolean; // Show item descriptions (default: true)
  showDate?: boolean; // Show publication date (default: true)
  showImage?: boolean; // Show item images (default: true)
  autoRefresh?: number; // Auto-refresh interval in minutes (0 = disabled)
}

// Music widget - for playing audio files
export interface MusicWidgetConfig {
  audioUrls?: string[]; // Array of audio file URLs
}

// Video widget - for playing video files
export interface VideoWidgetConfig {
  videoUrls?: string[]; // Array of video file URLs
}

// Iframe widget - for embedding external web pages
export interface IframeWidgetConfig {
  url: string; // URL to embed
  title?: string; // Optional title for the iframe
  allowFullscreen?: boolean; // Allow fullscreen (default: true)
  sandbox?: string[]; // Array of sandbox attributes (e.g., ['allow-scripts', 'allow-same-origin'])
  allow?: string[]; // Array of allowed features (e.g., ['camera', 'microphone', 'geolocation'])
  permissionPolicy?: string[]; // Array of permission policy directives (same as allow but newer standard)
  referrerPolicy?: string; // Referrer policy (e.g., 'no-referrer', 'origin', 'strict-origin-when-cross-origin')
}

// Folder widget - for organizing widgets in a folder
export interface FolderWidgetConfig {
  name: string; // Folder name
  icon?: string; // Optional icon name (lucide-react icon)
}

// Link widget - for displaying a clickable link
export interface LinkWidgetConfig {
  url: string; // URL to link to
  name?: string; // Optional display name for the link
}

// Map widget - for displaying a map view
export interface MapWidgetConfig {
  viewId: string;
  showControls?: boolean;
  zoom?: number;
}

// Calendar widget - for displaying a calendar view
export interface CalendarWidgetConfig {
  viewId: string;
  showControls?: boolean;
}

// Request/Response types
export interface CreateWidgetRequest {
  type: WidgetType;
  config?: string;
  position?: string;
  parent_id?: string;
}

export interface UpdateWidgetRequest {
  type?: WidgetType;
  config?: string;
  position?: string;
  parent_id?: string;
}

// Helper type to get the config type for a given widget type
export type WidgetConfigMap = {
  note_form: NoteFormWidgetConfig;
  note: NoteWidgetConfig;
  latest_note: LatestNoteWidgetConfig;
  countdown: CountdownWidgetConfig;
  file_upload: FileUploadWidgetConfig;
  carousel: CarouselWidgetConfig;
  heatmap: HeatmapWidgetConfig;
  rss: RssWidgetConfig;
  music: MusicWidgetConfig;
  video: VideoWidgetConfig;
  iframe: IframeWidgetConfig;
  folder: FolderWidgetConfig;
  link: LinkWidgetConfig;
  map: MapWidgetConfig;
  calendar: CalendarWidgetConfig;
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