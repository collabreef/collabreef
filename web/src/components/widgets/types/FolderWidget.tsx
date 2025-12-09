import { FC } from 'react';
import { Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { FolderWidgetConfig } from '@/types/widget';
import { WidgetProps, WidgetModule, WidgetConfigFormProps } from '../widgetRegistry';
import { registerWidget } from '../widgetRegistry';

// Folder Widget Component
const FolderWidget: FC<WidgetProps> = ({ config }) => {
  const folderConfig = config as FolderWidgetConfig;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex gap-2 items-center">
          <Folder size={20}/>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {folderConfig.name || 'Untitled Folder'}
          </div>
          {folderConfig.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {folderConfig.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Folder Widget Config Form
const FolderWidgetConfigForm: FC<WidgetConfigFormProps<FolderWidgetConfig>> = ({
  config,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Folder Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={config.name || ''}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700"
          placeholder="Enter folder name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
        <textarea
          value={config.description || ''}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700"
          placeholder="Enter folder description"
          rows={3}
        />
      </div>
    </div>
  );
};

// Register the widget
const folderWidgetModule: WidgetModule<FolderWidgetConfig> = {
  type: 'folder',
  label: 'widgets.types.folder',
  description: 'widgets.types.folderDesc',
  defaultConfig: {
    name: 'New Folder',
  },
  Component: FolderWidget,
  ConfigForm: FolderWidgetConfigForm,
};

registerWidget(folderWidgetModule);

export default FolderWidget;
