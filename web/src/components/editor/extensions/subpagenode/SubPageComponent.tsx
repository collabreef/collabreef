import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { FileText, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getNote } from "@/api/note"

const SubPageComponent: React.FC<NodeViewProps> = ({ node, extension, updateAttributes, editor, deleteNode }) => {
    const { noteId, title } = node.attrs
    const [showActions, setShowActions] = useState(false)
    const isEditable = editor.isEditable
    const navigate = useNavigate()
    const { t } = useTranslation()
    const hasCreated = useRef(false)

    // Create note on first mount when noteId is not yet set
    useEffect(() => {
        if (noteId || hasCreated.current) return
        hasCreated.current = true

        const { workspaceId, parentNoteId, createNote } = extension.options
        createNote(workspaceId, {
            content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
            visibility: 'workspace',
            parent_id: parentNoteId,
        }).then((newNote: { id: string }) => {
            updateAttributes({ noteId: newNote.id, title: '' })
            navigate(`/workspaces/${workspaceId}/notes/${newNote.id}`)
        }).catch(() => {
            deleteNode()
        })
    }, [])

    // Sync title from actual note whenever noteId is available
    useEffect(() => {
        if (!noteId) return
        const { workspaceId } = extension.options
        getNote(workspaceId, noteId).then((note: { title?: string }) => {
            const liveTitle = note.title || ''
            if (liveTitle !== title) {
                updateAttributes({ title: liveTitle })
            }
        }).catch(() => {})
    }, [noteId])

    const handleNavigate = () => {
        const { workspaceId } = extension.options
        navigate(`/workspaces/${workspaceId}/notes/${noteId}`)
    }

    if (!noteId) {
        return (
            <NodeViewWrapper className="sub-page-node my-1">
                <div className="flex items-center gap-2 border dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-neutral-800/50">
                    <Loader2 size={16} className="text-gray-400 animate-spin flex-shrink-0" />
                    <span className="text-sm text-gray-400">{t("notes.untitled")}</span>
                </div>
            </NodeViewWrapper>
        )
    }

    return (
        <NodeViewWrapper className="sub-page-node my-1">
            <div
                className="flex items-center gap-2 border dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-neutral-800/50 group cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-colors"
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
                onClick={handleNavigate}
            >
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <span className={`flex-1 text-sm font-medium truncate ${title ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                    {title || t("notes.untitled")}
                </span>
                <ExternalLink size={14} className="text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isEditable && showActions && (
                    <button
                        onClick={(e) => { e.stopPropagation(); deleteNode() }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title={t("actions.delete")}
                    >
                        <Trash2 size={12} className="text-red-500" />
                    </button>
                )}
            </div>
        </NodeViewWrapper>
    )
}

export default SubPageComponent
