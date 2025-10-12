import { FC } from "react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Editor, useEditorState } from "@tiptap/react"
import { useQuery } from "@tanstack/react-query"
import { getUserGenCommands } from "../../../../api/user"
import { useCurrentUserStore } from "../../../../stores/current-user"
import {GenCommand} from "../../../../types/user"
interface Props {
    editor: Editor
}

const TextSelectionMenu: FC<Props> = ({ editor }: any) => {

    const { user } = useCurrentUserStore()
    // Fetch commands
    const { data: commands = [], isLoading } = useQuery({
        queryKey: ["userGenCommands", user?.id],
        queryFn: async () => {
            const result = await getUserGenCommands(user!.id);
            return result || [];
        },
        enabled: !!user?.id,
    })

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
            options={{ placement: 'bottom-start' }}
        >
            <div className="text-selection-menu text-xs bg-white p-1 border rounded-md shadow-sm">
                {
                    commands && commands.map(c => (
                        <button onClick={() => editor.chain().focus().addAIGeneration(c).run()} className="px-3 py-2  rounded-md hover:bg-gray-300">
                            {c.name}
                        </button>
                    ))
                }

            </div>
        </BubbleMenu>
    )
}

export default TextSelectionMenu
