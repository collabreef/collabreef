import { FC, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, FileText, Plus, Search, Loader } from 'lucide-react';
import { getNote, getNotes, createNote, NoteData } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { NoteWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import Editor from '@/components/editor/Editor';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';
import { useToastStore } from '@/stores/toast';
import { extractTextFromTipTapJSON } from '@/utils/tiptap';
import { useNoteWebSocket } from '@/hooks/use-note-websocket';

interface NoteWidgetProps extends WidgetProps {
  config: NoteWidgetConfig;
}

const NoteWidget: FC<NoteWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const [note, setNote] = useState<NoteData | null>(null);

  // Connect to WebSocket for real-time collaboration
  const {
    noteData,
    hasYjsSnapshot,
    isReady: wsReady,
    title: wsTitle,
    content: wsContent,
    yDoc,
    yText
  } = useNoteWebSocket({
    noteId: config.noteId || '',
    workspaceId: workspaceId || '',
    enabled: !!config.noteId && !!workspaceId
  });

  // Only fetch from REST API if note is NOT initialized (no Y.js snapshot)
  const { data: fetchedNote, isLoading, error } = useQuery({
    queryKey: ['note', workspaceId, config.noteId],
    queryFn: () => getNote(workspaceId, config.noteId),
    enabled: !!workspaceId && !!config.noteId && hasYjsSnapshot === false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (hasYjsSnapshot && noteData) {
      // Note is initialized - use WebSocket data
      setNote(noteData as NoteData | null);
    } else if (!hasYjsSnapshot && fetchedNote) {
      // Note is not initialized - use REST API data
      setNote(fetchedNote);
    }
  }, [hasYjsSnapshot, noteData, fetchedNote]);

  if (!config.noteId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.noNoteSelected')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.noteNotFound')}
      </div>
    );
  }

  const handleOpenNote = () => {
    navigate(`/workspaces/${workspaceId}/notes/${config.noteId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Use WebSocket data if available, fallback to note data
  const displayTitle = wsTitle || note.title;
  const displayContent = wsContent || note.content;

  return (
    <Widget withPadding={false}>
      <div className="h-full flex flex-col overflow-auto p-4">
        {/* Metadata */}
        {config.showMetadata && (
          <div className='flex justify-between'>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
              {note.created_at && (
                <div className="flex items-center gap-1">
                  <span>{formatDate(note.created_at)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNote}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                title={t('widgets.openNote')}
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Note Header */}
        <div className=" flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {displayTitle && (
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayTitle}
              </div>
            )}
          </div>
        </div>

        {/* Note Content - Editable Editor with WebSocket */}
        {displayContent && (
          <div className="flex-1 overflow-auto">
            <Editor
              note={{ ...note, content: displayContent }}
              yDoc={yDoc}
              yText={yText}
              yjsReady={wsReady}
            />
          </div>
        )}

        {!displayContent && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            {t('widgets.emptyNote')}
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const NoteWidgetConfigForm: FC<WidgetConfigFormProps<NoteWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', workspaceId, 'widget-config'],
    queryFn: () => getNotes(workspaceId, 1, 100, ''),
    enabled: !!workspaceId,
  });

  const createNoteMutation = useMutation({
    mutationFn: () => {
      // Create an empty note with minimal content
      const emptyContent = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph' }]
      });
      return createNote(workspaceId, {
        content: emptyContent,
        visibility: 'workspace',
      });
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes', workspaceId, 'widget-config'] });
      // Automatically select the newly created note
      onChange({ ...config, noteId: newNote.id });
    },
    onError: () => {
      addToast({ type: 'error', title: t('notes.createError') });
    },
  });

  const handleCreateNote = () => {
    createNoteMutation.mutate();
  };

  const handleNoteSelect = (noteId: string) => {
    onChange({ ...config, noteId });
  };

  const filteredNotes = notes.filter((note: NoteData) => {
    if (!searchQuery.trim()) return true;
    const noteText = extractTextFromTipTapJSON(note.content || '').toLowerCase();
    return noteText.includes(searchQuery.toLowerCase());
  });

  const selectedNote = notes.find((n: NoteData) => n.id === config.noteId);

  return (
    <div className="space-y-4">
      {/* Selected Note Display */}
      {config.noteId && selectedNote && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('widgets.config.selectedNote')}
          </label>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {extractTextFromTipTapJSON(selectedNote.content || '').slice(0, 60) || t('notes.untitled')}
                </p>
                {selectedNote.created_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedNote.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Note Button */}
      <div>
        <button
          type="button"
          onClick={handleCreateNote}
          disabled={createNoteMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createNoteMutation.isPending ? (
            <>
              <Loader size={18} className="animate-spin" />
              <span className="text-sm font-medium">{t('common.creating')}</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span className="text-sm font-medium">{t('notes.createNew')}</span>
            </>
          )}
        </button>
      </div>

      {/* Search and Note List */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.config.selectNote')}
        </label>

        {/* Search input */}
        <div className="mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('views.searchNotes') || 'Search notes...'}
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="border dark:border-neutral-600 rounded-lg max-h-80 overflow-y-auto">
          {filteredNotes.length > 0 ? (
            <div className="divide-y dark:divide-neutral-700">
              {filteredNotes.map((note: NoteData) => {
                const noteText = note.content
                  ? extractTextFromTipTapJSON(note.content).slice(0, 80)
                  : t('notes.untitled');
                const isSelected = config.noteId === note.id;

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => note.id && handleNoteSelect(note.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-neutral-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <FileText
                        size={18}
                        className={isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                          {noteText}
                        </div>
                        {note.created_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(note.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <FileText size={32} className="mb-2" />
              <p className="text-sm">
                {searchQuery.trim() ? t('views.noNotesFound') : t('widgets.config.selectNotePlaceholder')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Show Metadata Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showMetadata"
          checked={config.showMetadata}
          onChange={(e) => onChange({ ...config, showMetadata: e.target.checked })}
        />
        <label htmlFor="showMetadata" className="text-sm">{t('widgets.config.showMetadata')}</label>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'note',
  label: 'widgets.types.note',
  description: 'widgets.types.noteDesc',
  defaultConfig: {
    noteId: '',
    showMetadata: true,
  },
  Component: NoteWidget,
  ConfigForm: NoteWidgetConfigForm,
});

export default NoteWidget;