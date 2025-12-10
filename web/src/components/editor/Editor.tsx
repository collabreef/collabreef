import DragHandle from '@tiptap/extension-drag-handle-react'
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { useEditor, EditorContext, EditorContent, findParentNode, posToDOMRect } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extensions"
import { BubbleMenu } from "@tiptap/react/menus"
import { TableKit } from "@tiptap/extension-table"
import { FC, useMemo, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Image, List, ListTodo, Paperclip, Quote, Sparkles, Table, Type } from 'lucide-react'
import { CommandItem, SlashCommand } from './extensions/slashcommand/SlashCommand'
import { Attachment } from './extensions/attachment/Attachment'
import { ImageNode } from './extensions/imagenode/ImageNode'
import { uploadFile, listFiles } from '@/api/file'
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id'
import { NoteData } from '@/api/note'
import { TextGenNode } from './extensions/textgen/TextGen'
import { listModels, textGen, TextGenModel } from '@/api/tool'
import { toast } from '@/stores/toast'
import { PhotoProvider } from 'react-photo-view'

interface Props {
  note: NoteData
  canDrag?: boolean
  onChange?: (data: any) => void
}

const Editor: FC<Props> = ({ note, onChange, canDrag = true }) => {
  const currentWorkspaceId = useCurrentWorkspaceId()
  const { t } = useTranslation("editor")
  const lastContentRef = useRef<string>(note.content)
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
        placeholder: t("placeholder")
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none',
        },
      }),
      TaskItem,
      Attachment.configure({
        upload: async (f: File) => {
          const res = await uploadFile(currentWorkspaceId, f)

          return {
            src: `/api/v1/workspaces/${currentWorkspaceId}/files/${res.filename}`,
            name: res.original_name
          }
        },
        workspaceId: currentWorkspaceId,
        listFiles: listFiles
      }),
      ImageNode.configure({
        upload: async (f: File) => {
          const res = await uploadFile(currentWorkspaceId, f)

          return {
            src: `/api/v1/workspaces/${currentWorkspaceId}/files/${res.filename}`,
            name: res.original_name
          }
        },
        workspaceId: currentWorkspaceId,
        listFiles: listFiles
      }),
      TableKit,
      TextGenNode.configure({
        listModels: async () => {
          try {
            const response = await listModels()
            return response
          }
          catch (e) {
            toast.error(JSON.stringify(e))
          }
        },
        generate: async (prompt: string, model: TextGenModel) => {
          try {
            const response = await textGen(prompt, model)
            return response
          }
          catch (e) {
            toast.error(JSON.stringify(e))
          }
        }
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }: { query: string }): CommandItem[] => {
            return [
              {
                icon: <Type size={14} />,
                label: t("Paragraph"),
                keywords: ["text"],
                command: ({ editor }: any) =>
                  editor.chain().focus().setParagraph().run(),
              },
              {
                icon: <Quote size={14} />,
                label: t("Quote"),
                keywords: ["quote"],
                command: ({ editor }: any) =>
                  editor.chain().focus().setBlockquote().run(),
              },
              {
                icon: <List size={16} />,
                label: t("BulletList"),
                keywords: ["list"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleBulletList().run(),
              },
              {
                icon: <ListTodo size={16} />,
                label: t("TaskList"),
                keywords: ["list"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleTaskList().run(),
              },
              {
                icon: <Paperclip size={16} />,
                label: t("Attachment"),
                keywords: ["file"],
                command: ({ editor }: any) =>
                  editor?.chain().focus().setFile({ src: null, name: null }).run()
              },
              {
                icon: <Image size={16} />,
                label: t("Image"),
                keywords: ["image"],
                command: ({ editor }: any) =>
                  editor?.chain().focus().setImage({ src: null, name: null }).run()
              },
              {
                icon: <Table size={16} />,
                label: t("table.name"),
                keywords: ["table"],
                command: ({ editor }: any) =>
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(),
              },
              {
                icon: <Sparkles size={16} />,
                label: t("textGen.name"),
                keywords: ["ai", "text gen"],
                command: ({ editor }: any) =>
                  editor.chain().focus().addTextGen().run(),
              },
              {
                icon: <Heading1 size={16} />,
                label: t("Heading 1"),
                keywords: ["h1", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run(),
              },
              {
                icon: <Heading2 size={16} />,
                label: t("Heading 2"),
                keywords: ["h2", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run(),
              },
              {
                icon: <Heading3 size={16} />,
                label: t("Heading 3"),
                keywords: ["h3", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run(),
              },
              {
                icon: <Heading4 size={16} />,
                label: t("Heading 4"),
                keywords: ["h4", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 4 }).run(),
              },
              {
                icon: <Heading5 size={16} />,
                label: t("Heading 5"),
                keywords: ["h5", "title", "header", "heading"],
                command: ({ editor }: any) =>
                  editor.chain().focus().toggleHeading({ level: 5 }).run(),
              },
              {
                icon: <Heading6 size={16} />,
                label: t("Heading 6"),
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
      if (onChange) {
        // Save as JSON string (recommended by TipTap)
        const json = editor.getJSON()
        const newContent = JSON.stringify(json)

        // Only trigger onChange if content actually changed
        if (newContent !== lastContentRef.current) {
          lastContentRef.current = newContent
          onChange({ content: newContent })
        }
      }
    },
  })

  // Update ref when note prop changes (e.g., navigating to different note)
  useEffect(() => {
    lastContentRef.current = note.content
  }, [note.content])

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
          <button className='p-2' onClick={() => editor.chain().focus().deleteColumn().run()}>{t("table.deleteColumn")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().addColumnAfter().run()}>{t("table.addColumn")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().deleteRow().run()}>{t("table.deleteRow")}</button>
          <button className='p-2' onClick={() => editor.chain().focus().addRowAfter().run()}>{t("table.addRow")}</button>
        </div>
      </BubbleMenu>
      <PhotoProvider>
        <EditorContent editor={editor} />
      </PhotoProvider>
    </EditorContext.Provider>
  )
}

export default Editor