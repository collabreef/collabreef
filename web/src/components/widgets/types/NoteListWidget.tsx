import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getNotes } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { NoteListWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import FullNote from '@/components/fullnote/FullNote';

interface NoteListWidgetProps {
  config: NoteListWidgetConfig;
}

const NoteListWidget: FC<NoteListWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();

  const { data: allNotes = [], isLoading } = useQuery({
    queryKey: ['notes', workspaceId, 'widget', config],
    queryFn: () => getNotes(workspaceId, 1, config.limit || 10, config.filter?.query || ''),
    enabled: !!workspaceId,
  });

  // Apply filters
  let notes = allNotes;
  if (config.filter?.visibility) {
    notes = notes.filter((n: any) => n.visibility === config.filter?.visibility);
  }

  // Apply sorting
  if (config.sortBy) {
    notes = [...notes].sort((a: any, b: any) => {
      const aVal = a[config.sortBy!];
      const bVal = b[config.sortBy!];
      if (config.sortOrder === 'asc') {
        return aVal < bVal ? -1 : 1;
      }
      return aVal > bVal ? -1 : 1;
    });
  }

  // Limit results
  notes = notes.slice(0, config.limit || 10);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.noNotes')}
      </div>
    );
  }

  const handleNoteClick = (noteId: string) => {
    navigate(`/workspaces/${workspaceId}/notes/${noteId}`);
  };

  return (
    <Widget>
      <div className="h-full flex flex-col gap-2 overflow-auto">
        {notes.map((note: any) => (
          <div
            key={note.id}
            onClick={() => handleNoteClick(note.id)}
            className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {note.content && (
                  <div className="text-xs text-gray-500 truncate mt-1">
                    <FullNote note={note} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};

export default NoteListWidget;