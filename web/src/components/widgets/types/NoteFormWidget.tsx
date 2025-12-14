import { FC, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Send, Bold, Italic, Underline, Strikethrough, Code, Heading, List, ListOrdered, Quote, FileCode, Table, Trash2, ListTodo, ChevronDown } from 'lucide-react';
import { createNote, NoteData } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { useToastStore } from '@/stores/toast';
import { NoteFormWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';
import { useEditor, EditorContent, findParentNode, posToDOMRect } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { TableKit } from '@tiptap/extension-table';
import UnderlineExtension from '@tiptap/extension-underline';
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { uploadFile, listFiles } from '@/api/file';
import { Attachment } from '@/components/editor/extensions/attachment/Attachment';
import { ImageNode } from '@/components/editor/extensions/imagenode/ImageNode';
import { BubbleMenu } from '@tiptap/react/menus';

interface NoteFormWidgetProps extends WidgetProps {
  config: NoteFormWidgetConfig;
}

const NoteFormWidget: FC<NoteFormWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const initContent = ""

  const [note, setNote] = useState<NoteData>({
    content: initContent
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 pl-4 italic text-gray-600 dark:text-gray-400"
          }
        },
        codeBlock: {
          HTMLAttributes: {
            class: "rounded bg-gray-800 text-gray-100 p-4 font-mono text-sm"
          }
        }
      }),
      UnderlineExtension,
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none',
        },
      }),
      TaskItem,
      Placeholder.configure({
        placeholder: config.placeholder || t('notes.contentPlaceholder')
      }),
      Attachment.configure({
        upload: async (f: File) => {
          const res = await uploadFile(workspaceId, f)
          return {
            src: `/api/v1/workspaces/${workspaceId}/files/${res.filename}`,
            name: res.original_name
          }
        },
        workspaceId: workspaceId,
        listFiles: listFiles
      }),
      ImageNode.configure({
        upload: async (f: File) => {
          const res = await uploadFile(workspaceId, f)
          return {
            src: `/api/v1/workspaces/${workspaceId}/files/${res.filename}`,
            name: res.original_name
          }
        },
        workspaceId: workspaceId,
        listFiles: listFiles
      }),
      TableKit,
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const content = JSON.stringify(json);
      setNote({ content });
    }
  });

  const createMutation = useMutation({
    mutationFn: () => {
      return createNote(workspaceId, {
        visibility: 'workspace',
        ...note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', workspaceId] });
      addToast({ type: 'success', title: t('notes.createSuccess') });
      // Reset editor content
      editor?.commands.clearContent();
      setNote({ content: initContent });
    },
    onError: () => {
      addToast({ type: 'error', title: t('notes.createError') });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const toolbar = config.toolbar || {};
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  const ToolbarButton: FC<{
    onClick: () => void;
    active?: boolean;
    icon: React.ReactNode;
    title: string;
  }> = ({ onClick, active, icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${active ? 'bg-gray-200 dark:bg-neutral-600' : ''
        }`}
    >
      {icon}
    </button>
  );

  const HeadingDropdown: FC = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
        title={t('common.heading')}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1 ${
          editor?.isActive('heading') ? 'bg-gray-200 dark:bg-neutral-600' : ''
        }`}
      >
        <Heading size={16} />
        <ChevronDown size={12} />
      </button>
      {showHeadingMenu && (
        <div className="absolute bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded shadow-lg z-10 w-16 max-h-[200px] overflow-y-scroll">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                setShowHeadingMenu(false);
              }}
              className={`w-full text-left hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${
                editor?.isActive('heading', { level }) ? 'bg-gray-200 dark:bg-neutral-600' : ''
              }`}
            >
              <span style={{ fontSize: `${2 - level * 0.2}em`, fontWeight: 'bold' }}>H{level}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Widget withPadding={false}>
      <div className='h-full flex flex-col'>
        {/* Toolbar */}
        {Object.values(toolbar).some(v => v) && (
          <div className="flex flex-wrap gap-1 p-2 border-b dark:border-neutral-700 bg-white dark:bg-neutral-800">
            {toolbar.showBold && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive('bold')}
                icon={<Bold size={16} />}
                title={t('common.bold')}
              />
            )}
            {toolbar.showItalic && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                active={editor?.isActive('italic')}
                icon={<Italic size={16} />}
                title={t('common.italic')}
              />
            )}
            {toolbar.showUnderline && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                active={editor?.isActive('underline')}
                icon={<Underline size={16} />}
                title={t('common.underline')}
              />
            )}
            {toolbar.showStrike && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                active={editor?.isActive('strike')}
                icon={<Strikethrough size={16} />}
                title={t('common.strikethrough')}
              />
            )}
            {toolbar.showCode && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleCode().run()}
                active={editor?.isActive('code')}
                icon={<Code size={16} />}
                title={t('common.code')}
              />
            )}
            {toolbar.showHeading && <HeadingDropdown />}
            {toolbar.showBulletList && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive('bulletList')}
                icon={<List size={16} />}
                title={t('common.bulletList')}
              />
            )}
            {toolbar.showOrderedList && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                active={editor?.isActive('orderedList')}
                icon={<ListOrdered size={16} />}
                title={t('common.orderedList')}
              />
            )}
            {toolbar.showTaskList && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleTaskList().run()}
                active={editor?.isActive('taskList')}
                icon={<ListTodo size={16} />}
                title={t('common.taskList')}
              />
            )}
            {toolbar.showBlockquote && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                active={editor?.isActive('blockquote')}
                icon={<Quote size={16} />}
                title={t('common.blockquote')}
              />
            )}
            {toolbar.showCodeBlock && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                active={editor?.isActive('codeBlock')}
                icon={<FileCode size={16} />}
                title={t('common.codeBlock')}
              />
            )}
            {toolbar.showTable && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
                active={editor?.isActive('table')}
                icon={<Table size={16} />}
                title={t('common.table')}
              />
            )}
            {toolbar.showTable && editor?.isActive('table') && (
              <ToolbarButton
                onClick={() => editor?.chain().focus().deleteTable().run()}
                active={false}
                icon={<Trash2 size={16} />}
                title={t('common.deleteTable')}
              />
            )}
          </div>
        )}


        <BubbleMenu
          editor={editor}
          shouldShow={() => editor.isActive('table') || editor.isActive('tableCell')}
          getReferencedVirtualElement={() => {
            const parentNode = findParentNode(
              node => node.type.name === 'table' || node.type.name === 'tableCell',
            )(editor.state.selection)
            if (parentNode) {
              const domRect = posToDOMRect(editor.view, parentNode.start, parentNode.start + parentNode.node.nodeSize)
              return {
                getBoundingClientRect: () => domRect,
                getClientRects: () => [domRect],
              }
            }
            return null
          }}
          options={{ placement: 'top-start', offset: 8 }}
        >
          <div className="flex gap-1 divide-x-2 bg-slate-50 border rounded shadow">
            <button className='p-2' onClick={() => editor.chain().focus().deleteColumn().run()}>{t("common.deleteColumn")}</button>
            <button className='p-2' onClick={() => editor.chain().focus().addColumnAfter().run()}>{t("common.addColumn")}</button>
            <button className='p-2' onClick={() => editor.chain().focus().deleteRow().run()}>{t("common.deleteRow")}</button>
            <button className='p-2' onClick={() => editor.chain().focus().addRowAfter().run()}>{t("common.addRow")}</button>
            <button className='p-2' onClick={() => editor.chain().focus().deleteTable().run()}>{t('common.deleteTable')}</button>
          </div>
        </BubbleMenu>

        {/* Editor */}
        <div className='flex-1 overflow-y-auto'>
          <EditorContent editor={editor} className="h-full prose dark:prose-invert max-w-none p-4" />
        </div>

        {/* Send Button */}
        <button
          disabled={createMutation.isPending}
          onClick={handleSave}
          className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
          {createMutation.isPending ? t('common.saving') : t('notes.quickCreate')}
        </button>
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const NoteFormWidgetConfigForm: FC<WidgetConfigFormProps<NoteFormWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();

  const toolbar = config.toolbar || {};

  const handleToolbarChange = (key: keyof NonNullable<NoteFormWidgetConfig['toolbar']>, value: boolean) => {
    onChange({
      ...config,
      toolbar: {
        ...toolbar,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('widgets.config.placeholder')}</label>
        <input
          type="text"
          value={config.placeholder || ''}
          onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
          placeholder={t('widgets.config.placeholderHint')}
        />
      </div>

      {/* Toolbar Configuration */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('widgets.config.toolbar')}</label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showBold || false}
                onChange={(e) => handleToolbarChange('showBold', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Bold size={14} />
                {t('common.bold')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showItalic || false}
                onChange={(e) => handleToolbarChange('showItalic', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Italic size={14} />
                {t('common.italic')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showUnderline || false}
                onChange={(e) => handleToolbarChange('showUnderline', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Underline size={14} />
                {t('common.underline')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showStrike || false}
                onChange={(e) => handleToolbarChange('showStrike', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Strikethrough size={14} />
                {t('common.strikethrough')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showCode || false}
                onChange={(e) => handleToolbarChange('showCode', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Code size={14} />
                {t('common.code')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showHeading || false}
                onChange={(e) => handleToolbarChange('showHeading', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Heading size={14} />
                {t('common.heading')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showBulletList || false}
                onChange={(e) => handleToolbarChange('showBulletList', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <List size={14} />
                {t('common.bulletList')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showOrderedList || false}
                onChange={(e) => handleToolbarChange('showOrderedList', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <ListOrdered size={14} />
                {t('common.orderedList')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showTaskList || false}
                onChange={(e) => handleToolbarChange('showTaskList', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <ListTodo size={14} />
                {t('common.taskList')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showBlockquote || false}
                onChange={(e) => handleToolbarChange('showBlockquote', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Quote size={14} />
                {t('common.blockquote')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showCodeBlock || false}
                onChange={(e) => handleToolbarChange('showCodeBlock', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <FileCode size={14} />
                {t('common.codeBlock')}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={toolbar.showTable || false}
                onChange={(e) => handleToolbarChange('showTable', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm flex items-center gap-1">
                <Table size={14} />
                {t('common.table')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'note_form',
  label: 'widgets.types.noteForm',
  description: 'widgets.types.noteFormDesc',
  defaultConfig: {
    toolbar: {
      showBold: true,
      showItalic: true,
      showUnderline: false,
      showStrike: false,
      showCode: false,
      showHeading: true,
      showBulletList: true,
      showOrderedList: true,
      showTaskList: false,
      showBlockquote: false,
      showCodeBlock: false,
      showLink: false,
      showImage: false,
      showTable: false,
    },
  },
  Component: NoteFormWidget,
  ConfigForm: NoteFormWidgetConfigForm,
});

export default NoteFormWidget;