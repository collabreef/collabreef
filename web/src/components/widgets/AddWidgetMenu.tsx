import { FC, useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import { createWidget, WidgetType } from '@/api/widget';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { useToastStore } from '@/stores/toast';
import { stringifyWidgetConfig, stringifyWidgetPosition } from '@/types/widget';
import { getAllWidgets, getWidget } from './widgetRegistry';
import BottomSheet from '@/components/bottomsheet/BottomSheet';

interface AddWidgetMenuProps {
  parentId?: string;
}

const AddWidgetMenu: FC<AddWidgetMenuProps> = ({ parentId }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [config, setConfig] = useState<any>({});

  const menuRef = useRef<HTMLDivElement>(null);

  // Get all registered widgets
  const allWidgets = getAllWidgets();

  // Handle window resize to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when clicking outside (desktop only)
  useEffect(() => {
    if (!isMenuOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isMobile]);

  const createMutation = useMutation({
    mutationFn: () => {
      const widgetModule = getWidget(selectedType!);
      const defaultWidth = widgetModule?.minWidth ?? 4;
      const defaultHeight = widgetModule?.minHeight ?? 4;
      const defaultSize = { x: 0, y: 0, width: defaultWidth, height: defaultHeight };

      return createWidget(workspaceId, {
        type: selectedType!,
        config: stringifyWidgetConfig(config),
        position: stringifyWidgetPosition(defaultSize),
        parent_id: parentId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', workspaceId] });
      addToast({ type: 'success', title: t('widgets.createSuccess') });
      handleClose();
    },
    onError: () => {
      addToast({ type: 'error', title: t('widgets.createError') });
    },
  });

  const handleClose = () => {
    setIsMenuOpen(false);
    setStep('type');
    setSelectedType(null);
    setConfig({});
  };

  const handleTypeSelect = (type: WidgetType) => {
    const widgetModule = getWidget(type);
    if (!widgetModule) return;

    setSelectedType(type);
    setConfig(widgetModule.defaultConfig);

    // If widget has config form, show config step
    if (widgetModule.ConfigForm) {
      setStep('config');
    } else {
      // Otherwise, create directly
      createMutation.mutate();
    }
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

  const renderWidgetList = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
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
  );

  const renderConfigStep = () => (
    <div className="p-4 space-y-4">
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
  );

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <>
        <button
          aria-label="add widget"
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          <PlusCircle size={20} />
        </button>

        <BottomSheet isOpen={isMenuOpen} onClose={handleClose}>
          <div className="pb-4">
            {step === 'type' ? renderWidgetList() : renderConfigStep()}
          </div>
        </BottomSheet>
      </>
    );
  }

  // Desktop: Use dropdown menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="add widget"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
      >
        <PlusCircle size={20} />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg shadow-lg z-50 min-w-[400px] max-w-md max-h-[80vh] overflow-auto">
          <div className="p-4">
            {step === 'type' ? (
              <div className="grid grid-cols-1 gap-3">
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
      )}
    </div>
  );
};

export default AddWidgetMenu;
