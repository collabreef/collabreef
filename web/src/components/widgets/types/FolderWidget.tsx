import { FC } from 'react';
import { Folder } from 'lucide-react';
import { FolderWidgetConfig } from '@/types/widget';
import { WidgetProps, WidgetModule, WidgetConfigFormProps } from '../widgetRegistry';
import { registerWidget } from '../widgetRegistry';

// Folder Widget Component
const FolderWidget: FC<WidgetProps> = ({ config }) => {
  const folderConfig = config as FolderWidgetConfig;

  return (
    <div className="flex h-full p-4 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="relative flex gap-2 items-center w-full text-left select-none text-gray-600 dark:text-gray-400 ">
        <Folder className='shrink-0' size={20} />
        <div className="flex-1 truncate">
          {folderConfig.name || 'Untitled Folder'}
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
  minWidth: 1,
  minHeight: 1,
};

registerWidget(folderWidgetModule);

export default FolderWidget;
