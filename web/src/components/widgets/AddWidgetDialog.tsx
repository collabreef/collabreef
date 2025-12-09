import { FC, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { createWidget, WidgetType } from '@/api/widget';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { useToastStore } from '@/stores/toast';
import { stringifyWidgetConfig, stringifyWidgetPosition } from '@/types/widget';
import { getAllWidgets, getWidget } from './widgetRegistry';

interface AddWidgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
}

const AddWidgetDialog: FC<AddWidgetDialogProps> = ({ isOpen, onClose, parentId }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [config, setConfig] = useState<any>({});

  // Get all registered widgets
  const allWidgets = getAllWidgets();

  const createMutation = useMutation({
    mutationFn: () => {
      return createWidget(workspaceId, {
        type: selectedType!,
        config: stringifyWidgetConfig(config),
        position: stringifyWidgetPosition({ x: 0, y: 0, width: 4, height: 4 }),
        parent_id: parentId || undefined,
      });
    },
    onSuccess: () => {
      // Invalidate both the general widgets query and the specific folder query
      queryClient.invalidateQueries({ queryKey: ['widgets', workspaceId] });
      addToast({ type: 'success', title: t('widgets.createSuccess') });
      handleClose();
    },
    onError: () => {
      addToast({ type: 'error', title: t('widgets.createError') });
    },
  });

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setConfig({});
    onClose();
  };

  const handleTypeSelect = (type: WidgetType) => {
    const widgetModule = getWidget(type);
    if (!widgetModule) return;

    setSelectedType(type);
    setConfig(widgetModule.defaultConfig);
    setStep('config');
  };

  const handleCreate = () => {
    if (selectedType) {
      createMutation.mutate();
    }
  };

  const renderConfigForm = () => {
    if (!selectedType) return null;

    const widgetModule = getWidget(selectedType);
    if (!widgetModule || !widgetModule.ConfigForm) return null;

    const ConfigFormComponent = widgetModule.ConfigForm;
    return <ConfigFormComponent config={config} onChange={setConfig} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            {step === 'type' ? t('widgets.addWidget') : t('widgets.configureWidget')}
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            <X size={20} />
          </button>
        </div>

        {step === 'type' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allWidgets.map((widget) => (
              <button
                key={widget.type}
                onClick={() => handleTypeSelect(widget.type)}
                className="p-4 text-left border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-1"
              >
                <div className="font-medium">{t(widget.label)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t(widget.description)}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {renderConfigForm()}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setStep('type')}
                className="flex-1 px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {t('actions.back')}
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {createMutation.isPending ? t('common.creating') : t('actions.create')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetDialog;