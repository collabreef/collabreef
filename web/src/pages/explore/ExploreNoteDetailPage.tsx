import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, FC } from "react"
import { getPublicNote, NoteData } from "@/api/note"
import { useTranslation } from "react-i18next"
import NoteDetailSidebar from "@/components/notedetailsidebar/NoteDetailSidebar"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import { Ellipsis, ArrowLeft } from "lucide-react"
import ReadOnlyNoteContent from "@/components/readonlynotecontent/ReadOnlyNoteContent"

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
    const navigate = useNavigate()

    if (!note) {
        return (
            <TwoColumnMain className="bg-white dark:bg-neutral-800">
                <div className="w-full">
                    <div className="flex flex-col min-h-dvh animate-pulse">
                        <div className="flex">
                            <div className="w-full m-auto">
                                <div className="px-6 pt-16">
                                    <div className="flex flex-col gap-4">
                                        <div className="hidden xl:block">
                                            <div className="h-10 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                                            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-5/6"></div>
                                            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-4/5"></div>
                                            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                                            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-3/4"></div>
                                            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TwoColumnMain>
        )
    }

    return (
        <>
            <TwoColumnMain className="bg-white dark:bg-neutral-800">
                <div className="w-full">
                    <div className="flex flex-col min-h-dvh">
                        <div className="p-2 xl:p-0 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0 xl:hidden">
                                <button
                                    onClick={() => navigate(-1)}
                                    aria-label="back"
                                    className="inline-flex p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex-1 text-lg font-semibold min-w-0 truncate">
                                    {note.title || t("notes.untitled")}
                                </div>
                                <button
                                    onClick={toggleSidebar}
                                    className="inline-flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
                                    title={isSidebarCollapsed ? "Show Info" : "Hide Info"}
                                >
                                    <Ellipsis size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-full m-auto">
                                <div className="lg:p-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="hidden xl:flex xl:gap-2 p-4 xl:items-center">
                                            <div className="flex-1 text-4xl font-semibold min-w-0">
                                                {note.title || t("notes.untitled")}
                                            </div>
                                        </div>
                                        <div className="px-4">
                                            <div key={`note-${note.id}`}>
                                                <ReadOnlyNoteContent note={note} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TwoColumnMain>
            <TwoColumnSidebar>
                {note && <NoteDetailSidebar note={note} />}
            </TwoColumnSidebar>
        </>
    )
}

export default ExploreNoteDetailPage