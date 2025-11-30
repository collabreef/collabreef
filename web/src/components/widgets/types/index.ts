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

// Re-export for convenience
export { default as NoteFormWidget } from './NoteFormWidget';
export { default as StatsWidget } from './StatsWidget';
export { default as TemplateFormWidget } from './TemplateFormWidget';
export { default as ViewWidget } from './ViewWidget';
export { default as NoteWidget } from './NoteWidget';
