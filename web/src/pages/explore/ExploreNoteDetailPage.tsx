import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useEffect, useState, FC } from "react"
import { getPublicNote, NoteData } from "@/api/note"
import { useTranslation } from "react-i18next"
import NoteDetailView from "@/components/notedetail/NoteDetailView"
import NoteDetailSidebar from "@/components/notedetailsidebar/NoteDetailSidebar"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import { Info } from "lucide-react"

const ExploreNoteDetailPage = () => {
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
        }
    }, [fetchedNote])

    return (
        <TwoColumn>
            <ExploreNoteDetailContent note={note} t={t} />
        </TwoColumn>
    )
}

interface ExploreNoteDetailContentProps {
    note: NoteData | null
    t: any
}

const ExploreNoteDetailContent: FC<ExploreNoteDetailContentProps> = ({ note, t }) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    return (
        <>
            <TwoColumnMain
                className="bg-white dark:bg-neutral-800 "
            >
                <NoteDetailView
                    note={note}
                    backLink="/explore/notes"
                    title={t("pages.noteDetail.note")}
                    isEditable={false}
                    menu={
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title={isSidebarCollapsed ? "Show Info" : "Hide Info"}
                        >
                            <Info size={18} />
                        </button>
                    }
                />
            </TwoColumnMain>
            <TwoColumnSidebar>
                {note && <NoteDetailSidebar note={note} onClose={toggleSidebar} />}
            </TwoColumnSidebar>
        </>
    )
}

export default ExploreNoteDetailPage