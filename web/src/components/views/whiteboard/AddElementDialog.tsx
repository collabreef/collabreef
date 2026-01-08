import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { createViewObject } from '@/api/view';
import { getNotes } from '@/api/note';
import { getViews } from '@/api/view';
import { useToastStore } from '@/stores/toast';
import { Dialog } from 'radix-ui';
import { WhiteboardNoteData, WhiteboardViewRefData } from '@/types/view';

interface AddElementDialogProps {
    workspaceId: string;
    viewId: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    elementType: 'note' | 'view';
}

const AddElementDialog = ({
    workspaceId,
    viewId,
    isOpen,
    onOpenChange,
    elementType
}: AddElementDialogProps) => {
    const { t } = useTranslation();
    const { addToast } = useToastStore();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch notes or views based on element type
    const { data: notes = [] } = useQuery({
        queryKey: ['notes', workspaceId, searchQuery],
        queryFn: () => getNotes(workspaceId, 1, 100, searchQuery),
        enabled: isOpen && elementType === 'note'
    });

    const { data: views = [] } = useQuery({
        queryKey: ['views', workspaceId],
        queryFn: () => getViews(workspaceId),
        enabled: isOpen && elementType === 'view'
    });

    const filteredViews = searchQuery
        ? views.filter((v: any) => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : views;

    const addElementMutation = useMutation({
        mutationFn: async (id: string) => {
            const position = { x: 100, y: 100 };

            if (elementType === 'note') {
                const noteData: WhiteboardNoteData = {
                    position,
                    noteId: id,
                    width: 250,
                    height: 200
                };
                return createViewObject(workspaceId, viewId, {
                    name: `Note`,
                    type: 'whiteboard_note',
                    data: JSON.stringify(noteData)
                });
            } else {
                const viewData: WhiteboardViewRefData = {
                    position,
                    viewId: id,
                    width: 250,
                    height: 200
                };
                return createViewObject(workspaceId, viewId, {
                    name: `View`,
                    type: 'whiteboard_view',
                    data: JSON.stringify(viewData)
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', workspaceId, viewId] });
            onOpenChange(false);
            setSearchQuery('');
        },
        onError: () => {
            addToast({ title: t('views.objectCreatedError'), type: 'error' });
        }
    });

    const items = elementType === 'note' ? notes : filteredViews;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] max-h-[80vh] overflow-y-auto z-50">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {elementType === 'note'
                            ? (t('whiteboard.addNote') || 'Add Note')
                            : (t('whiteboard.addView') || 'Add View')}
                    </Dialog.Title>

                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    elementType === 'note'
                                        ? (t('whiteboard.searchNotes') || 'Search notes')
                                        : (t('whiteboard.searchViews') || 'Search views')
                                }
                                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                        {items.length > 0 ? (
                            items.map((item: any) => (
                                <button
                                    key={item.id}
                                    onClick={() => addElementMutation.mutate(item.id)}
                                    disabled={addElementMutation.isPending}
                                    className="w-full text-left p-3 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                                >
                                    <div className="font-medium truncate">
                                        {elementType === 'note' ? (
                                            <div className="text-sm line-clamp-2">
                                                {item.content ? `${item.content.substring(0, 100)}...` : 'Empty note'}
                                            </div>
                                        ) : (
                                            item.name
                                        )}
                                    </div>
                                    {elementType === 'view' && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {item.type}
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                {searchQuery
                                    ? (t('whiteboard.noResultsFound') || 'No results found')
                                    : elementType === 'note'
                                        ? (t('whiteboard.noNotes') || 'No notes available')
                                        : (t('whiteboard.noViews') || 'No views available')}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Dialog.Close asChild>
                            <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                                {t('common.cancel')}
                            </button>
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AddElementDialog;
