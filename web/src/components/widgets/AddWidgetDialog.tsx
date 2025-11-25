import { FC, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { createWidget, WidgetType } from '@/api/widget';
import { getViews } from '@/api/view';
import { getGenTemplates } from '@/api/gen-template';
import { getNotes } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { useToastStore } from '@/stores/toast';
import {
  NoteFormWidgetConfig,
  StatsWidgetConfig,
  TemplateFormWidgetConfig,
  ViewWidgetConfig,
  NoteListWidgetConfig,
  NoteWidgetConfig,
  stringifyWidgetConfig,
  stringifyWidgetPosition,
} from '@/types/widget';

interface AddWidgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIDGET_TYPES: { value: WidgetType; label: string; description: string }[] = [
  { value: 'note_form', label: 'widgets.types.noteForm', description: 'widgets.types.noteFormDesc' },
  { value: 'stats', label: 'widgets.types.stats', description: 'widgets.types.statsDesc' },
  { value: 'template_form', label: 'widgets.types.templateForm', description: 'widgets.types.templateFormDesc' },
  { value: 'view', label: 'widgets.types.view', description: 'widgets.types.viewDesc' },
  { value: 'note_list', label: 'widgets.types.noteList', description: 'widgets.types.noteListDesc' },
  { value: 'note', label: 'widgets.types.note', description: 'widgets.types.noteDesc' },
];

const AddWidgetDialog: FC<AddWidgetDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [name, setName] = useState('');

  // Config states for different widget types
  const [noteFormConfig, setNoteFormConfig] = useState<NoteFormWidgetConfig>({});
  const [statsConfig, setStatsConfig] = useState<StatsWidgetConfig>({
    statType: 'note_count',
  });
  const [templateFormConfig, setTemplateFormConfig] = useState<TemplateFormWidgetConfig>({
    templateId: '',
  });
  const [viewConfig, setViewConfig] = useState<ViewWidgetConfig>({
    viewId: '',
    showControls: true,
  });
  const [noteListConfig, setNoteListConfig] = useState<NoteListWidgetConfig>({
    limit: 5,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [noteConfig, setNoteConfig] = useState<NoteWidgetConfig>({
    noteId: '',
    showMetadata: true,
  });
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  // Fetch views and templates for config
  const { data: views = [] } = useQuery({
    queryKey: ['views', workspaceId],
    queryFn: () => getViews(workspaceId),
    enabled: !!workspaceId && selectedType === 'view',
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['gen-templates', workspaceId],
    queryFn: () => getGenTemplates(workspaceId, 1, 100, ''),
    enabled: !!workspaceId && selectedType === 'template_form',
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', workspaceId, 'widget-dialog'],
    queryFn: () => getNotes(workspaceId, 1, 100, ''),
    enabled: !!workspaceId && selectedType === 'note',
  });

  const createMutation = useMutation({
    mutationFn: () => {
      let config = '';
      switch (selectedType) {
        case 'note_form':
          config = stringifyWidgetConfig<'note_form'>(noteFormConfig);
          break;
        case 'stats':
          config = stringifyWidgetConfig<'stats'>(statsConfig);
          break;
        case 'template_form':
          config = stringifyWidgetConfig<'template_form'>(templateFormConfig);
          break;
        case 'view':
          config = stringifyWidgetConfig<'view'>(viewConfig);
          break;
        case 'note_list':
          config = stringifyWidgetConfig<'note_list'>(noteListConfig);
          break;
        case 'note':
          config = stringifyWidgetConfig<'note'>(noteConfig);
          break;
      }

      return createWidget(workspaceId, {
        type: selectedType!,
        config,
        position: stringifyWidgetPosition({ x: 0, y: 0, width: 4, height: 4 }),
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
    setStep('type');
    setSelectedType(null);
    setName('');
    setNoteFormConfig({});
    setStatsConfig({ statType: 'note_count' });
    setTemplateFormConfig({ templateId: '' });
    setViewConfig({ viewId: '', showControls: true });
    setNoteListConfig({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' });
    setNoteConfig({ noteId: '', showMetadata: true });
    setNoteSearchQuery('');
    onClose();
  };

  const handleTypeSelect = (type: WidgetType) => {
    setSelectedType(type);
    setName(t(WIDGET_TYPES.find((t) => t.value === type)?.label || ''));
    setStep('config');
  };

  const handleCreate = () => {
    if (name.trim() && selectedType) {
      createMutation.mutate();
    }
  };

  const renderConfigForm = () => {
    switch (selectedType) {
      case 'note_form':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.placeholder')}</label>
              <input
                type="text"
                value={noteFormConfig.placeholder || ''}
                onChange={(e) => setNoteFormConfig({ ...noteFormConfig, placeholder: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                placeholder={t('widgets.config.placeholderHint')}
              />
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.statType')}</label>
              <select
                value={statsConfig.statType}
                onChange={(e) => setStatsConfig({ ...statsConfig, statType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              >
                <option value="note_count">{t('widgets.config.noteCount')}</option>
                <option value="recent_notes">{t('widgets.config.recentNotes')}</option>
                <option value="note_by_visibility">{t('widgets.config.noteByVisibility')}</option>
              </select>
            </div>
          </div>
        );

      case 'template_form':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.selectTemplate')}</label>
              <select
                value={templateFormConfig.templateId}
                onChange={(e) => setTemplateFormConfig({ ...templateFormConfig, templateId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              >
                <option value="">{t('widgets.config.selectTemplatePlaceholder')}</option>
                {templates.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'view':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.selectView')}</label>
              <select
                value={viewConfig.viewId}
                onChange={(e) => setViewConfig({ ...viewConfig, viewId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              >
                <option value="">{t('widgets.config.selectViewPlaceholder')}</option>
                {views.map((view: any) => (
                  <option key={view.id} value={view.id}>
                    {view.name} ({view.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showControls"
                checked={viewConfig.showControls}
                onChange={(e) => setViewConfig({ ...viewConfig, showControls: e.target.checked })}
              />
              <label htmlFor="showControls" className="text-sm">{t('widgets.config.showControls')}</label>
            </div>
          </div>
        );

      case 'note_list':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.limit')}</label>
              <input
                type="number"
                value={noteListConfig.limit}
                onChange={(e) => setNoteListConfig({ ...noteListConfig, limit: parseInt(e.target.value) || 5 })}
                min={1}
                max={20}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.sortBy')}</label>
              <select
                value={noteListConfig.sortBy}
                onChange={(e) => setNoteListConfig({ ...noteListConfig, sortBy: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              >
                <option value="created_at">{t('widgets.config.createdAt')}</option>
                <option value="updated_at">{t('widgets.config.updatedAt')}</option>
                <option value="title">{t('widgets.config.title')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.sortOrder')}</label>
              <select
                value={noteListConfig.sortOrder}
                onChange={(e) => setNoteListConfig({ ...noteListConfig, sortOrder: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              >
                <option value="desc">{t('widgets.config.newest')}</option>
                <option value="asc">{t('widgets.config.oldest')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.config.filterVisibility')}</label>
              <select
                value={noteListConfig.filter?.visibility || ''}
                onChange={(e) =>
                  setNoteListConfig({
                    ...noteListConfig,
                    filter: { ...noteListConfig.filter, visibility: e.target.value as any || undefined },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
              >
                <option value="">{t('widgets.config.all')}</option>
                <option value="private">{t('visibility.private')}</option>
                <option value="workspace">{t('visibility.workspace')}</option>
                <option value="public">{t('visibility.public')}</option>
              </select>
            </div>
          </div>
        );

      case 'note': {
        const filteredNotes = notes.filter((note: any) => {
          if (!noteSearchQuery.trim()) return true;
          const noteText = note.content ? note.content.replace(/<[^>]*>/g, '').toLowerCase() : '';
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
                    const noteText = note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 80) : t('notes.untitled');
                    const isSelected = noteConfig.noteId === note.id;

                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => setNoteConfig({ ...noteConfig, noteId: note.id })}
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
              {noteConfig.noteId && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {t('widgets.config.selectedNote')}: {
                    notes.find((n: any) => n.id === noteConfig.noteId)?.content
                      ?.replace(/<[^>]*>/g, '')
                      .slice(0, 50) || t('notes.untitled')
                  }
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showMetadata"
                checked={noteConfig.showMetadata}
                onChange={(e) => setNoteConfig({ ...noteConfig, showMetadata: e.target.checked })}
              />
              <label htmlFor="showMetadata" className="text-sm">{t('widgets.config.showMetadata')}</label>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
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
          <div className="space-y-3">
            {WIDGET_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className="w-full p-4 text-left border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="font-medium">{t(type.label)}</div>
                <div className="text-sm text-gray-500 mt-1">{t(type.description)}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('widgets.widgetName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                placeholder={t('widgets.widgetNamePlaceholder')}
              />
            </div>

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
                disabled={!name.trim() || createMutation.isPending}
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