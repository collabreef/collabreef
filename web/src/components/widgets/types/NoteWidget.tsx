import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, User } from 'lucide-react';
import { getNote, getNotes } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { NoteWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import FullNote from '@/components/fullnote/FullNote';
import { extractTextFromTipTapJSON } from '@/utils/tiptap';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface NoteWidgetProps extends WidgetProps {
  config: NoteWidgetConfig;
}

const NoteWidget: FC<NoteWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();

  const { data: note, isLoading, error } = useQuery({
    queryKey: ['note', workspaceId, config.noteId],
    queryFn: () => getNote(workspaceId, config.noteId),
    enabled: !!workspaceId && !!config.noteId,
  });

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

  return (
    <Widget withPadding={false}>
      <div className="h-full flex flex-col overflow-auto">
        {/* Note Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {note.title && (
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {note.title}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {config.showMetadata && (
          <div className='flex justify-between p-4'>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
              {note.created_at && (
                <div className="flex items-center gap-1">
                  <span>{formatDate(note.created_at)}</span>
                </div>
              )}
              {note.created_by && (
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{note.created_by}</span>
                </div>
              )}
            </div>
            
            <div>
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

        {/* Note Content */}
        {note.content && (
          <div className="flex-1 overflow-auto">
            <FullNote note={note} />
          </div>
        )}

        {!note.content && (
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
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', workspaceId, 'widget-config'],
    queryFn: () => getNotes(workspaceId, 1, 100, ''),
    enabled: !!workspaceId,
  });

  const filteredNotes = notes.filter((note: any) => {
    if (!noteSearchQuery.trim()) return true;
    const noteText = extractTextFromTipTapJSON(note.content || '').toLowerCase();
    return noteText.includes(noteSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('widgets.config.selectNote')}</label>
        <input
          type="text"
          value={noteSearchQuery}
          onChange={(e) => setNoteSearchQuery(e.target.value)}
          placeholder={t('views.searchNotes')}
          className="w-full px-3 py-2 mb-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        />
        <div className="border dark:border-neutral-600 rounded-lg max-h-60 overflow-y-auto">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note: any) => {
              const noteText = note.content ? extractTextFromTipTapJSON(note.content).slice(0, 80) : t('notes.untitled');
              const isSelected = config.noteId === note.id;

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onChange({ ...config, noteId: note.id })}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 border-b dark:border-neutral-700 last:border-b-0 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  <div className="text-sm truncate">{noteText}</div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
              {noteSearchQuery.trim() ? t('views.noNotesFound') : t('widgets.config.selectNotePlaceholder')}
            </div>
          )}
        </div>
        {config.noteId && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('widgets.config.selectedNote')}: {
              extractTextFromTipTapJSON(
                notes.find((n: any) => n.id === config.noteId)?.content || ''
              ).slice(0, 50) || t('notes.untitled')
            }
          </div>
        )}
      </div>
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