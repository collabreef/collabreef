import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import useCurrentWorkspaceId from "../../../hooks/useCurrentworkspaceId"
import { useParams, useNavigate, Link } from "react-router-dom"
import { createNote, getNote, NoteData, updateNote } from "../../../api/note"
import { ChevronLeft, LoaderIcon } from "lucide-react"
import Editor from "../../../components/editor/Editor"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import TransitionWrapper from "../../../components/transitionwrapper/TransitionWrapper"

const NoteEdit = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [note, setNote] = useState<NoteData>({ blocks: [], visibility: "private" })
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { noteId } = useParams()
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    // Query for fetching single note
    const { data: fetchedNote } = useQuery({
        queryKey: ['note', currentWorkspaceId, noteId],
        queryFn: () => getNote(currentWorkspaceId, noteId!),
        enabled: !!noteId && !!currentWorkspaceId,
    })

    // Mutation for creating note
    const createNoteMutation = useMutation({
        mutationFn: (data: NoteData) => createNote(currentWorkspaceId, data),
        onSuccess: async (data: NoteData) => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['notes', currentWorkspaceId] })
                // Wait a bit to ensure the invalidation is processed
                await new Promise(resolve => setTimeout(resolve, 100))
                navigate(`/workspaces/${currentWorkspaceId}/note/${data.id}`)
            } catch (error) {
                console.error('Error invalidating queries:', error)
                navigate('/')
            }
        },
    })

    // Mutation for updating note
    const updateNoteMutation = useMutation({
        mutationFn: (data: NoteData) => updateNote(currentWorkspaceId, data),
        onSuccess: async (data: NoteData) => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['notes', currentWorkspaceId] })
                // Wait a bit to ensure the invalidation is processed
                await new Promise(resolve => setTimeout(resolve, 100))
                navigate(`/workspaces/${currentWorkspaceId}/note/${data.id}`)
            } catch (error) {
                console.error('Error invalidating queries:', error)
                navigate('/')
            }
        },
    })

    function handleContentChange(data: any) {
        setNote(prev => ({
            ...prev,
            blocks: data.blocks,
        }))
    }
    function handleSave() {
        setIsSaving(true);
        if (noteId) {
            updateNoteMutation.mutate({ ...note, id: noteId })
        } else {
            createNoteMutation.mutate(note)
        }
    }
    useEffect(() => {
        if (fetchedNote) {
            setNote(fetchedNote)
            setIsLoading(false)
        } else if (!noteId) {
            setIsLoading(false)
        }
    }, [fetchedNote, noteId])

    return <TransitionWrapper
        className="px-0 xl:px-6 bg-white dark:bg-neutral-900"
    >
        <div className="flex flex-col min-h-screen">
            <div className="py-2 px-4 sm:px-0  flex items-center justify-between border-b xl:border-b-0">
                <div className="flex items-center gap-2">
                    <Link to={`/workspaces/${currentWorkspaceId}/`} className="inline-flex p-3 rounded-full ">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="text-lg font-semibold">
                        {
                            noteId ? t("pages.noteEdit.editNote") :  t("pages.noteEdit.newNote")
                        }
                    </div>
                </div>
                <div className="">
                    <button title="save" onClick={handleSave} className="px-4 ">
                        {isSaving ? <LoaderIcon size={16} className=" animate-spin" /> : <span className="text-blue-600 font-semibold">
                            {t("actions.save")}
                        </span> }
                    </button>
                </div>
            </div>
            <div className="grow flex justify-start">
                <div className="flex-1">
                    <div className="w-full m-auto">
                        <div className=" w-full py-3 px-5 m-auto max-w-3xl">
                            {
                                !isLoading && <Editor value={note} onChange={handleContentChange} />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </TransitionWrapper>
}
export default NoteEdit