import { FC } from "react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Editor, useEditorState } from "@tiptap/react"

interface Props {
    editor: Editor
}

const TextSelectionMenu: FC<Props> = ({ editor }) => {

    const editorState = useEditorState({
        editor,
        selector: ({ editor }) => {
            if (!editor) return null;

            return {
                isEditable: editor.isEditable,
                currentSelection: editor.state.selection,
                currentSelectionContent: editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " "),
            };
        },
    })

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor }) => !editor.isEmpty && !editor.state.selection.empty && editor.isActive("paragraph")}
            options={{ placement: 'bottom' }}
        >
            <div className="text-selection-menu">


            </div>
        </BubbleMenu>
    )
}

export default TextSelectionMenu
