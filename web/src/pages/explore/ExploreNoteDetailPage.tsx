import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { getPublicNote, NoteData } from "@/api/note"
import { useTranslation } from "react-i18next"
import NoteDetailView from "@/components/notedetail/NoteDetailView"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"

const ExploreNoteDetailPage = () => {
    const [_, setIsLoading] = useState<boolean>(true)
    const [note, setNote] = useState<NoteData | null>(null)
    const { noteId } = useParams()
    const { t } = useTranslation()

    const { data: fetchedNote } = useQuery({
        queryKey: ['publicNote', noteId],
        queryFn: () => getPublicNote(noteId!),
        enabled: !!noteId,
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
        <TwoColumn>
            <TwoColumnMain>
                <NoteDetailView
                    note={note}
                    backLink="/explore/notes"
                    title={t("pages.noteDetail.note")}
                    isEditable={false}
                />
            </TwoColumnMain>
            <TwoColumnSidebar>
                <div className="w-96">

                </div>
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

export default ExploreNoteDetailPage