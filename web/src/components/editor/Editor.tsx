import DragHandle from '@tiptap/extension-drag-handle-react'
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { useEditor, EditorContext, EditorContent, findParentNode, posToDOMRect } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extensions"
import { BubbleMenu } from "@tiptap/react/menus"
import { TableKit } from "@tiptap/extension-table"
import { FC, useMemo, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Image, List, ListTodo, Paperclip, Quote, Table, Type } from 'lucide-react'
import { CommandItem, SlashCommand } from './extensions/slashcommand/SlashCommand'
import { Attachment } from './extensions/attachment/Attachment'
import { ImageNode } from './extensions/imagenode/ImageNode'
import { uploadFile, listFiles } from '@/api/file'
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id'
import { NoteData } from '@/api/note'
import * as Y from 'yjs'

interface Props {
  note: NoteData
  canDrag?: boolean
  onChange?: (data: any) => void
  yDoc?: Y.Doc | null
  yText?: Y.Text | null
  yjsReady?: boolean
}

const Editor: FC<Props> = ({
  note,
  onChange,
  canDrag = true,
  yDoc,
  yText,
  yjsReady
}) => {
  const currentWorkspaceId = useCurrentWorkspaceId()
  const { t } = useTranslation()
  const lastContentRef = useRef<string>(note.content)
  const isApplyingYjsUpdate = useRef(false)
  const isComposing = useRef(false)
  const pendingUpdate = useRef<{ content: string } | null>(null)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 pl-4 italic text-gray-600"
          }
        },
        codeBlock: {
          HTMLAttributes: {
            class: "rounded bg-gray-800 text-gray-100 p-4 font-mono text-sm"
          }
        }
      }),
      Placeholder.configure({
        placeholder: t("editor.placeholder")
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none',
        },
      }),
      TaskItem,
      Attachment.configure({
        upload: async (f: File, onProgress?: (percent: number) => void) => {
          const res = await uploadFile(currentWorkspaceId, f, onProgress)

          return {
            src: `/api/v1/workspaces/${currentWorkspaceId}/files/${res.filename}`,
            name: res.original_name
          }
        },
        workspaceId: currentWorkspaceId,
        listFiles: listFiles
      }),
      ImageNode.configure({
        upload: async (f: File, onProgress?: (percent: number) => void) => {
          const res = await uploadFile(currentWorkspaceId, f, onProgress)

          return {
            src: `/api/v1/workspaces/${currentWorkspaceId}/files/${res.filename}`,
            name: res.original_name
          }
        },
        workspaceId: currentWorkspaceId,
        listFiles: listFiles
      }),
      TableKit,
      SlashCommand.configure({
        suggestion: {
          items: ({ query }: { query: string }): CommandItem[] => {
            return [
              {
                icon: <Type size={14} />,
                label: t("editor.Paragraph"),
                keywords: ["text"],
                command: ({ editor }: any) =>
                  editor.chain().focus().setParagraph().run(),
              },
              {
                icon: <Quote size={14} />,
                label: t("editor.Quote"),
                keywords: ["quote"],
                command: ({ editor }: any) =>
                  editor.chain().focus().setBlockquote().run(),
              },
              {
                icon: <List size={16} />,
                label: t("editor.BulletList"),
                keywords: ["list"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleBulletList().run(),
              },
              {
                icon: <ListTodo size={16} />,
                label: t("editor.TaskList"),
                keywords: ["list"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleTaskList().run(),
              },
              {
                icon: <Paperclip size={16} />,
                label: t("editor.Attachment"),
                keywords: ["file"],
                command: ({ editor }: any) =>
                  editor?.chain().focus().setFile({ src: null, name: null }).run()
              },
              {
                icon: <Image size={16} />,
                label: t("editor.Image"),
                keywords: ["image"],
                command: ({ editor }: any) =>
                  editor?.chain().focus().setImage({ src: null, name: null }).run()
              },
              {
                icon: <Table size={16} />,
                label: t("editor.table.name"),
                keywords: ["table"],
                command: ({ editor }: any) =>
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(),
              },
              {
                icon: <Heading1 size={16} />,
                label: t("editor.Heading 1"),
                keywords: ["h1", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run(),
              },
              {
                icon: <Heading2 size={16} />,
                label: t("editor.Heading 2"),
                keywords: ["h2", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run(),
              },
              {
                icon: <Heading3 size={16} />,
                label: t("editor.Heading 3"),
                keywords: ["h3", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run(),
              },
              {
                icon: <Heading4 size={16} />,
                label: t("editor.Heading 4"),
                keywords: ["h4", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 4 }).run(),
              },
              {
                icon: <Heading5 size={16} />,
                label: t("editor.Heading 5"),
                keywords: ["h5", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 5 }).run(),
              },
              {
                icon: <Heading6 size={16} />,
                label: t("editor.Heading 6"),
                keywords: ["h6", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 6 }).run(),
              }
            ].filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase()) ||
              item.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
            )
          },
        }
      })
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
    content: JSON.parse(note.content),
    onUpdate({ editor }) {
      // Avoid infinite loop when applying Y.js updates
      if (isApplyingYjsUpdate.current) return;

      // Save as JSON string (recommended by TipTap)
      const json = editor.getJSON()
      const newContent = JSON.stringify(json)

      // Only process if content actually changed
      if (newContent !== lastContentRef.current) {
        lastContentRef.current = newContent

        // If composing (IME input), store pending update and wait for composition end
        if (isComposing.current) {
          pendingUpdate.current = { content: newContent };
          return;
        }

        // Update Y.Text for CRDT collaboration
        if (yText && yDoc) {
          console.log('[Editor] Before Y.Text update, content length:', newContent.length);
          yDoc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, newContent);
          }, 'local');
          console.log('[Editor] Updated Y.Text from editor change, origin: local');
        } else {
          console.log('[Editor] WARNING: yText or yDoc is null, cannot update CRDT');
        }

        // Trigger onChange callback if provided
        if (onChange) {
          onChange({ content: newContent })
        }
      }
    },
  })

  // Update ref when note prop changes (e.g., navigating to different note)
  useEffect(() => {
    lastContentRef.current = note.content
  }, [note.content])

  // Sync Y.js content to editor when yjsReady becomes true
  // This ensures the editor shows the latest state after Y.js snapshot + updates are applied
  useEffect(() => {
    if (!editor || !yText || !yjsReady) return;

    const yjsContent = yText.toString();

    // Skip if Y.Text is empty (new note or not initialized)
    if (!yjsContent || yjsContent.length === 0) {
      console.log('[Editor] Y.js ready but yText is empty, using note.content');
      return;
    }

    // Skip if content is the same
    if (yjsContent === lastContentRef.current) {
      console.log('[Editor] Y.js ready, content already in sync');
      return;
    }

    try {
      const contentJson = JSON.parse(yjsContent);

      // Set flag to prevent infinite loop
      isApplyingYjsUpdate.current = true;

      // Update editor with Y.js content
      editor.commands.setContent(contentJson);
      lastContentRef.current = yjsContent;

      isApplyingYjsUpdate.current = false;

      console.log('[Editor] Applied Y.js content on ready, length:', yjsContent.length);
    } catch (error) {
      console.error('[Editor] Error parsing Y.js content on ready:', error);
    }
  }, [editor, yText, yjsReady])

  // Listen for Y.Text changes from other clients and update editor
  useEffect(() => {
    if (!editor || !yText) return;

    const observer = () => {
      const newContent = yText.toString();

      // Avoid applying if content is the same
      if (newContent === lastContentRef.current) return;

      try {
        const contentJson = JSON.parse(newContent);

        // Set flag to prevent infinite loop
        isApplyingYjsUpdate.current = true;

        // Update editor content
        editor.commands.setContent(contentJson);
        lastContentRef.current = newContent;

        isApplyingYjsUpdate.current = false;

        console.log('Applied Y.js content update from other client');
      } catch (error) {
        console.error('Error parsing Y.js content:', error);
      }
    };

    yText.observe(observer);

    return () => {
      yText.unobserve(observer);
    };
  }, [editor, yText])

  // Note: Content sync is now handled by Y.js CRDT updates
  // No need for periodic full content sync anymore

  // Handle composition events for IME input
  useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.view) return;

    const editorElement = editor.view.dom;
    if (!editorElement) return;

    const handleCompositionStart = () => {
      isComposing.current = true;
    };

    const handleCompositionEnd = () => {
      isComposing.current = false;

      // Process any pending update after composition ends
      if (pendingUpdate.current) {
        const { content: newContent } = pendingUpdate.current;
        pendingUpdate.current = null;

        // Update Y.Text for CRDT collaboration
        if (yText && yDoc) {
          console.log('[Editor] Composition ended, sending pending update, content length:', newContent.length);
          yDoc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, newContent);
          }, 'local');
        }

        // Trigger onChange callback if provided
        if (onChange) {
          onChange({ content: newContent });
        }
      }
    };

    editorElement.addEventListener('compositionstart', handleCompositionStart);
    editorElement.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      editorElement.removeEventListener('compositionstart', handleCompositionStart);
      editorElement.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [editor, yDoc, yText, onChange]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  const providerValue = useMemo(() => ({ editor }), [editor])
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  if (!editor) {
    return null
  }

  return (
    <EditorContext.Provider value={providerValue}>
      {!isTouchDevice && canDrag && <DragHandle editor={editor} className='border rounded shadow-sm p-1'>
        <GripVertical size={12} />
      </DragHandle>}

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
          <button className='p-2' onClick={() => editor.chain().focus().deleteColumn().run()}>{t("editor.table.deleteColumn")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().addColumnAfter().run()}>{t("editor.table.addColumn")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().deleteRow().run()}>{t("editor.table.deleteRow")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().addRowAfter().run()}>{t("editor.table.addRow")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().deleteTable().run()}>{t('editor.table.deleteTable')}</button>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </EditorContext.Provider>
  )
}

export default Editor