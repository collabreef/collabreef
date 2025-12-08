/**
 * Widget Types Index
 *
 * This file imports all widget types to ensure they are registered.
 * Simply importing this file will automatically register all widgets.
 */

// Import all widgets to trigger their registration
import './NoteFormWidget';
import './StatsWidget';
import './TemplateFormWidget';
import './ViewWidget';
import './NoteWidget';
import './LatestNoteWidget';
import './CountdownWidget';
import './FileUploadWidget';
import './CarouselWidget';
import './HeatmapWidget';
import './RssWidget';
import './MusicWidget';
import './VideoWidget';
import './IframeWidget';

// Re-export for convenience
export { default as NoteFormWidget } from './NoteFormWidget';
export { default as StatsWidget } from './StatsWidget';
export { default as TemplateFormWidget } from './TemplateFormWidget';
export { default as ViewWidget } from './ViewWidget';
export { default as NoteWidget } from './NoteWidget';
export { default as LatestNoteWidget } from './LatestNoteWidget';
export { default as CountdownWidget } from './CountdownWidget';
export { default as FileUploadWidget } from './FileUploadWidget';
export { default as CarouselWidget } from './CarouselWidget';
export { default as HeatmapWidget } from './HeatmapWidget';
export { default as RssWidget } from './RssWidget';
export { default as MusicWidget } from './MusicWidget';
export { default as VideoWidget } from './VideoWidget';
export { default as IframeWidget } from './IframeWidget';
