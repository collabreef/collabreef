import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import useCurrentWorkspaceId from "../../../hooks/use-currentworkspace-id"
import { useEffect, useState } from "react"
import { getNote, NoteData } from "../../../api/note"
import NoteDetailMenu from "../../../components/notedetailmenu/NoteDetailMenu"
import { useCurrentUserStore } from "../../../stores/current-user"
import { useTranslation } from "react-i18next"
import NoteDetailView from "../../../components/notedetail/NoteDetailView"

const NoteDetailPage = () => {
    const [_, setIsLoading] = useState<boolean>(true)
    const [note, setNote] = useState<NoteData | null>(null)
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { user } = useCurrentUserStore()
    const { noteId } = useParams()
    const { t } = useTranslation()

    const { data: fetchedNote } = useQuery({
        queryKey: ['note', currentWorkspaceId, noteId],
        queryFn: () => getNote(currentWorkspaceId, noteId!),
        enabled: !!noteId && !!currentWorkspaceId,
    })
    useEffect(() => {
        if (fetchedNote) {
            setNote(fetchedNote)
            setIsLoading(false)
        } else if (!noteId) {
            setIsLoading(false)
        }
    }, [fetchedNote, noteId])

    return (
        <NoteDetailView
            note={note}
            backLink=".."
            title={t("pages.noteDetail.note")}
            authorName={user?.name}
            menu={note ? <NoteDetailMenu note={note} /> : undefined}
        />
    )
}

export default NoteDetailPage
