import { FC, useRef, useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteNote, NoteData, updateNoteVisibility } from "@/api/note"
import { useTranslation } from "react-i18next"
import { Trash2, Ellipsis, Globe2, Lock, Building } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import { useToastStore } from "@/stores/toast"
import { Visibility } from "@/types/visibility"

interface NoteDetailMenuProps {
    note: NoteData
}

const NoteDetailMenu: FC<NoteDetailMenuProps> = ({ note }) => {
    const { t } = useTranslation()
    const { workspaceId } = useParams<{ workspaceId?: string }>()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [isMenuOpened, setIsMenuOpened] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Delete note mutation
    const deleteNoteMutation = useMutation({
        mutationFn: () => {
            if (!workspaceId || !note.id) throw new Error('Missing required parameters')
            return deleteNote(workspaceId, note.id)
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['notes', workspaceId] })
                navigate(`/workspaces/${workspaceId}/notes`)
            } catch (error) {
                addToast({ title: t('messages.deleteNoteFailed'), type: 'error' })
            }
        },
    })

    // Update visibility mutation
    const updateVisibilityMutation = useMutation({
        mutationFn: (visibility: Visibility) => {
            if (!workspaceId || !note.id) throw new Error('Missing required parameters')
            return updateNoteVisibility(workspaceId, note.id, visibility)
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['note', workspaceId, note.id] })
                setIsMenuOpened(false);
            } catch (error) {
                addToast({ title: t('messages.updateVisibilityFailed'), type: 'error' })
            }
        },
    })

    const handleDelete = () => {
        if (confirm(t('messages.confirmDelete'))) {
            deleteNoteMutation.mutate()
            setIsMenuOpened(false)
        }
    }

    const handleUpdateVisibility = (visibility: Visibility) => {
        if (visibility === note.visibility) {
            return
        }
        updateVisibilityMutation.mutate(visibility)
    }

    const handleOpenMenu = () => {
        setIsMenuOpened(prev => !prev)
    }

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            const clickedInsideMenu = menuRef.current && menuRef.current.contains(target)
            const clickedButton = buttonRef.current && buttonRef.current.contains(target)

            if (!clickedInsideMenu && !clickedButton) {
                setIsMenuOpened(false)
            }
        }

        if (isMenuOpened) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isMenuOpened])

    return (
        <>
            <div className="relative">
                <button ref={buttonRef} className="p-2" onClick={handleOpenMenu}>
                    <Ellipsis size={16} />
                </button>
                {isMenuOpened && (
                    <div
                        ref={menuRef}
                        className="absolute top-full right-0 min-w-[240px] overflow-y-auto bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border dark:border-neutral-700 rounded-lg shadow-lg z-50"
                    >
                        <div className="flex flex-col p-2">
                            {workspaceId && (
                                <>
                                    {
                                        note.visibility != "private" && <button
                                            className="px-3 py-2 flex items-center gap-3"
                                            onClick={() => handleUpdateVisibility("private")}>
                                            <Lock size={16} />
                                            {t("actions.makePrivate")}
                                        </button>
                                    }
                                    {
                                        note.visibility != "workspace" && <button
                                            className="px-3 py-2 flex items-center gap-3"
                                            onClick={() => handleUpdateVisibility("workspace")}>
                                            <Building size={16} />
                                            {t("actions.makeWorkspace")}
                                        </button>
                                    }
                                    {
                                        note.visibility != "public" && <button
                                            className="px-3 py-2 flex items-center gap-3"
                                            onClick={() => handleUpdateVisibility("public")}>
                                            <Globe2 size={16} />
                                            {t("actions.makePublic")}
                                        </button>
                                    }
                                    <button
                                        onClick={handleDelete}
                                        className="px-3 py-2 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                                    >
                                        <Trash2 size={16} />
                                        <span>{t('actions.delete')}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default NoteDetailMenu
