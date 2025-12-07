import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, User, Clock, Check, Loader } from 'lucide-react';
import { getNotes, updateNote } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { LatestNoteWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import Editor from '@/components/editor/Editor';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface LatestNoteWidgetProps extends WidgetProps {
  config: LatestNoteWidgetConfig;
}

const LatestNoteWidget: FC<LatestNoteWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes', workspaceId, 'latest-widget'],
    queryFn: () => getNotes(workspaceId, 1, 100, ''),
    enabled: !!workspaceId,
  });

  const updateNoteMutation = useMutation({
    mutationFn: (data: { content: string; noteId: string }) => {
      return updateNote(workspaceId, {
        id: data.noteId,
        content: data.content,
      });
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['notes', workspaceId, 'latest-widget'] });
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('idle');
    },
  });

  // Sort notes and get the latest one
  const sortBy = config.sortBy || 'created_at';
  const sortedNotes = notes.length > 0 ? [...notes].sort((a: any, b: any) => {
    const dateA = new Date(a[sortBy]).getTime();
    const dateB = new Date(b[sortBy]).getTime();
    return dateB - dateA; // Most recent first
  }) : [];

  const latestNote = sortedNotes[0];

  const handleNoteChange = useCallback((data: { content: string }) => {
    if (!latestNote?.id) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setSaveStatus('saving');

    // Set new debounced save timer (1 second delay)
    saveTimerRef.current = setTimeout(() => {
      updateNoteMutation.mutate({
        noteId: latestNote.id!,
        content: data.content,
      });
    }, 1000);
  }, [latestNote?.id, updateNoteMutation]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Widget>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      </Widget>
    );
  }

  if (error || notes.length === 0) {
    return (
      <Widget>
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          {notes.length === 0 ? t('widgets.noNotes') : t('common.error')}
        </div>
      </Widget>
    );
  }

  const handleOpenNote = () => {
    navigate(`/workspaces/${workspaceId}/notes/${latestNote.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const showMetadata = config.showMetadata !== false; // Default to true

  return (
    <Widget withPadding={false}>
      <div className="h-full flex flex-col overflow-auto py-4">
        {/* Metadata */}
        {showMetadata && (
          <div className='flex justify-between px-4 mb-2'>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
              {latestNote.created_at && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDate(sortBy === 'created_at' ? latestNote.created_at : latestNote.updated_at)}</span>
                </div>
              )}
              {latestNote.created_by && (
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{latestNote.created_by}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save Status Indicator */}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader className="animate-spin" size={12} />
                  <span>{t('widgets.saving')}</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Check size={12} />
                  <span>{t('widgets.saved')}</span>
                </div>
              )}

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

        {/* Note Content - Editable Editor */}
        {latestNote.content && (
          <div className="flex-1 overflow-auto">
            <Editor note={latestNote} onChange={handleNoteChange} />
          </div>
        )}

        {!latestNote.content && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            {t('widgets.emptyNote')}
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const LatestNoteWidgetConfigForm: FC<WidgetConfigFormProps<LatestNoteWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('widgets.config.sortBy')}</label>
        <select
          value={config.sortBy || 'created_at'}
          onChange={(e) => onChange({ ...config, sortBy: e.target.value as 'created_at' | 'updated_at' })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        >
          <option value="created_at">{t('widgets.config.sortByCreated')}</option>
          <option value="updated_at">{t('widgets.config.sortByUpdated')}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showMetadata"
          checked={config.showMetadata !== false}
          onChange={(e) => onChange({ ...config, showMetadata: e.target.checked })}
        />
        <label htmlFor="showMetadata" className="text-sm">{t('widgets.config.showMetadata')}</label>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'latest_note',
  label: 'widgets.types.latestNote',
  description: 'widgets.types.latestNoteDesc',
  defaultConfig: {
    showMetadata: true,
    sortBy: 'created_at',
  },
  Component: LatestNoteWidget,
  ConfigForm: LatestNoteWidgetConfigForm,
});

export default LatestNoteWidget;
