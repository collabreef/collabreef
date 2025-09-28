import DragHandle from '@tiptap/extension-drag-handle-react'
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { useEditor, EditorContext, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extensions"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical } from 'lucide-react'
import { SlashCommand } from './extensions/slashcommand/SlashCommand'

interface Props {
  data: any
  onChange?: (data: any) => void
}

const Editor: FC<Props> = ({ data, onChange }) => {
  const { t } = useTranslation()
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
        placeholder: t("placeholder.note")
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none',
        },
      }),
      TaskItem,
      SlashCommand
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-3 focus:outline-none',
      },
    },
    content: data ?? ``,
    onUpdate({ editor }) {
      if (onChange) {
        onChange(editor.getJSON())
      }
    },
  })

  const providerValue = useMemo(() => ({ editor }), [editor])

  return (
    <EditorContext.Provider value={providerValue}>
      <DragHandle editor={editor} className='border rounded shadow-sm p-1'>
        <GripVertical size={12} />
      </DragHandle>
      <EditorContent editor={editor} className='sm:ml-4' />
    </EditorContext.Provider>
  )
}

export default Editor