import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import { Attachment } from '../editor/extensions/attachment/Attachment'
import { ImageNode } from '../editor/extensions/imagenode/ImageNode'
import { PhotoProvider } from 'react-photo-view'

interface RendererProps {
    content: string
}

const Renderer: React.FC<RendererProps> = ({ content }) => {

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
            TaskItem,
            Attachment,
            ImageNode,
            TableKit,
        ],
        content: JSON.parse(content),
        editable: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl max-w-full overflow-x-auto text-neutral-800 dark:text-gray-400 focus:outline-none',
            },
        },
    })

    return <PhotoProvider>
        <EditorContent editor={editor} />
    </PhotoProvider>
}

export default Renderer