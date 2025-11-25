import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, Calendar, User } from 'lucide-react';
import { getNote } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { NoteWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';

interface NoteWidgetProps {
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
    <Widget>
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
          <div className='flex justify-between'>
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
          <div
            className="flex-1 prose prose-sm dark:prose-invert max-w-none overflow-auto"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
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

export default NoteWidget;