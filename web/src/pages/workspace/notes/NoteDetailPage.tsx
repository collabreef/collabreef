
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import useCurrentWorkspaceId from "../../../hooks/use-currentworkspace-id"
import { useEffect, useState } from "react"
import { getNote, NoteData } from "../../../api/note"
import TransitionWrapper from "../../../components/transitionwrapper/TransitionWrapper"
import { ChevronLeft } from "lucide-react"
import NoteDetailMenu from "../../../components/notedetailmenu/NoteDetailMenu"
import FullNote from "../../../components/fullnote/FullNote"
import NoteTime from "../../../components/notetime/NoteTime"
import { useCurrentUserStore } from "../../../stores/current-user"
import VisibilityLabel from "../../../components/visibilitylabel/VisibilityLabel"
import { useTranslation } from "react-i18next"

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

    return <TransitionWrapper
        className="px-0 xl:px-6 bg-white dark:bg-neutral-900"
    >
        {
            note &&
            <div className="flex flex-col min-h-dvh">
                <div className="py-2 px-4 sm:px-0 flex items-center justify-between border-b xl:border-b-0">
                    <div className="flex items-center gap-2">
                        <Link to=".." className="inline-flex p-3 rounded-full ">
                            <ChevronLeft size={20} />
                        </Link>
                        <div className="text-lg font-semibold">
                            {t("pages.noteDetail.note")}
                        </div>
                    </div>
                    <div className="inline-flex">
                        <NoteDetailMenu note={note} />
                    </div>
                </div>
                <div className="flex">
                    <div className="max-w-2xl w-full m-auto">
                        <div className="px-4 pt-4 pb-2 flex gap-2 items-center" >
                            <span className="flex items-center rounded text-gray-500" >
                                <VisibilityLabel value={note.visibility} />
                            </span>
                            <span className="text-gray-500">
                                {note && <NoteTime time={note.updated_at ?? ""} />}
                            </span>
                            <span className=" text-orange-500">
                                {user?.name}
                            </span>
                        </div>
                        <div className="pb-10">
                            {note && <FullNote note={note} />}
                        </div>
                    </div>
                    <div className="hidden lg:block w-[260px]">

                    </div>
                </div>
            </div>
        }
    </TransitionWrapper>
}



export default NoteDetailPage
