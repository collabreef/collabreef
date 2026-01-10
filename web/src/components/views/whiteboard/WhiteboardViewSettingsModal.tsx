import { Dialog } from 'radix-ui';
import { useTranslation } from 'react-i18next';
import { View } from '@/types/view';

interface WhiteboardViewSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    view: View;
}

const WhiteboardViewSettingsModal = ({
    isOpen,
    onOpenChange,
    view
}: WhiteboardViewSettingsModalProps) => {
    const { t } = useTranslation();

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[400px] z-50">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t('views.settings') || 'Settings'}
                    </Dialog.Title>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('views.viewName') || 'View Name'}
                            </label>
                            <input
                                type="text"
                                value={view.name}
                                readOnly
                                className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-700"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                {t('whiteboard.settingsInfo') || 'Whiteboard settings can be configured here'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close asChild>
                            <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                                {t('common.close') || 'Close'}
                            </button>
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default WhiteboardViewSettingsModal;
