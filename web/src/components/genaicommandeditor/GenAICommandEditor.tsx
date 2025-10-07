import { useEditor, EditorContext, EditorContent, findParentNode, posToDOMRect } from "@tiptap/react"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import useCurrentWorkspaceId from '../../hooks/use-currentworkspace-id'
import { NoteData } from '../../api/note'

interface Props {
  note: NoteData
  onChange?: (data: any) => void
}

const Editor: FC<Props> = ({ note, onChange }) => {
  const doc = note ? {
    type: "doc",
    content: note.blocks?.map(b => ({ type: b.type, content: b.data.content, attrs: b.data.attrs }))
  } : ``

  const currentWorkspaceId = useCurrentWorkspaceId()
  const { t } = useTranslation("editor")
  const editor = useEditor({
    extensions: [
        Paragraph
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-3 focus:outline-none',
      },
    },
    content: doc,
    onUpdate({ editor }) {
      if (onChange) {
        const doc = editor.getJSON()

        const json = {
          blocks: (doc.content || []).map(block => {
            return {
              type: block.type!,
              data: {
                content: block.content,
                attrs: block.attrs
              }
            }
          })
        }

        onChange(json)
      }
    },
  })

  const providerValue = useMemo(() => ({ editor }), [editor])

  return (
    <EditorContext.Provider value={providerValue}>
      <EditorContent editor={editor} className='relative' />
    </EditorContext.Provider>
  )
}

export default Editor