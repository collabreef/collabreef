import { FC } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { WidgetData } from '@/api/widget';
import { WidgetType, parseWidgetConfig } from '@/types/widget';
import { getWidget } from './widgetRegistry';

interface WidgetRendererProps {
  widget: WidgetData;
  isEditMode: boolean;
  canDragResize: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onFolderClick?: (folderId: string) => void;
}

const WidgetRenderer: FC<WidgetRendererProps> = ({
  widget,
  isEditMode,
  onEdit,
  onDelete,
  onFolderClick,
}) => {
  const renderWidgetContent = () => {
    const widgetType = widget.type as WidgetType;
    const config: any = parseWidgetConfig({ ...widget, config: widget.config || '{}' } as any);

    // Get widget from registry
    const widgetModule = getWidget(widgetType);

    if (!widgetModule) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Unknown widget type: {widgetType}
        </div>
      );
    }

    const WidgetComponent = widgetModule.Component;
    return <WidgetComponent config={config} />;
  };

  // Handle folder click
  const handleClick = () => {
    if (widget.type === 'folder' && !isEditMode && onFolderClick && widget.id) {
      onFolderClick(widget.id);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div
        className="flex-1 overflow-auto"
        onClick={handleClick}
      >
        {renderWidgetContent()}
      </div>

      {isEditMode && (
        <div className='absolute w-full h-full pointer-events-none'>
          <div className='absolute z-10 bottom-full right-0 p-1 bg-neutral-200 dark:bg-neutral-800 shadow-lg border border-neutral-500 space-x-0.5 pointer-events-auto'>
            <button
              onClick={onEdit}
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900 text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className='absolute top-0 right-0 w-full h-full widget-drag-handle pointer-events-auto cursor-move'>

          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetRenderer;