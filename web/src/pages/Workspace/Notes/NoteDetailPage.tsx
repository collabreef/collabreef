
import { useQuery } from "@tanstack/react-query"
import BlockRenderer from "../../../components/blockrenderer/BlockRenderer"
import { Link, useParams } from "react-router-dom"
import useCurrentWorkspaceId from "../../../hooks/useCurrentworkspaceId"
import { useEffect, useState } from "react"
import { getNote, NoteData } from "../../../api/note"
import TransitionWrapper from "../../../components/transitionwrapper/TransitionWrapper"
import { ChevronLeft } from "lucide-react"
import NoteDetailMenu from "../../../components/notedetailmenu/NoteDetailMenu"
import FullNote from "../../../components/fullnote/FullNote"

const NoteDetailPage = () => {
    const [_, setIsLoading] = useState<boolean>(true)
    const [note, setNote] = useState<NoteData>({ blocks: [], tags: [], visibility: "private" })
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { noteId } = useParams()

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
        <div className="flex flex-col min-h-dvh ">
            <div className="py-2 px-4 sm:px-0 flex items-center justify-between border-b xl:border-b-0">
                <div className="">
                    <Link to=".." className="inline-flex p-3 rounded-full ">
                        <ChevronLeft size={20} />
                    </Link>
                </div>
                <div className="inline-flex">
                    <NoteDetailMenu noteId={noteId ?? ""} />
                </div>
            </div>
            <div className="grow flex">
                <div className=" flex-1 ">
                    <div className="max-w-2xl w-full m-auto py-4">
                        <FullNote note={note} />
                    </div>
                </div>
                <div className="hidden lg:block w-[260px]">

                </div>
            </div>
        </div>
    </TransitionWrapper>
}



export default NoteDetailPage
