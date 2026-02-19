import { FC, useMemo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TableKit } from "@tiptap/extension-table"
import { Attachment } from "../editor/extensions/attachment/Attachment"
import { ImageNode } from "../editor/extensions/imagenode/ImageNode"
import { NoteData } from "@/api/note"

interface ReadOnlyNoteContentProps {
    note: NoteData
}

const DEFAULT_CONTENT = { type: 'doc', content: [{ type: 'paragraph' }] }

const ReadOnlyNoteContent: FC<ReadOnlyNoteContentProps> = ({ note }) => {
    const { parsed, error } = useMemo(() => {
        try {
            return { parsed: JSON.parse(note.content), error: false }
        } catch {
            return { parsed: DEFAULT_CONTENT, error: true }
        }
    }, [note.content])

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
            TaskList.configure({
                HTMLAttributes: {
                    class: 'list-none',
                },
            }),
            TaskItem.configure({
                HTMLAttributes: {
                    class: 'pointer-events-none',
                },
            }),
            Attachment.configure({
                upload: undefined,
                workspaceId: undefined,
                listFiles: undefined
            }),
            ImageNode.configure({
                upload: undefined,
                workspaceId: undefined,
                listFiles: undefined
            }),
            TableKit,
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none',
            },
        },
        content: parsed,
        editable: false,
    }, [note.id])

    if (error) {
        return <div className='text-red-500'>Error parsing content</div>
    }

    if (!editor) {
        return null
    }

    return (
        <div className="pointer-events-none select-text">
            <EditorContent editor={editor} />
        </div>
    )
}

export default ReadOnlyNoteContent
