
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import useCurrentWorkspaceId from "../../../hooks/useCurrentworkspaceId"
import { useEffect, useState } from "react"
import { getNote, NoteData } from "../../../api/note"
import TransitionWrapper from "../../../components/transitionwrapper/TransitionWrapper"
import { ChevronLeft,  Dot, Globe, Lock, Pencil, Users2 } from "lucide-react"
import NoteDetailMenu from "../../../components/notedetailmenu/NoteDetailMenu"
import FullNote from "../../../components/fullnote/FullNote"
import NoteTime from "../../../components/notetime/NoteTime"
import { useCurrentUserStore } from "../../../stores/current-user"

const NoteDetailPage = () => {
    const [_, setIsLoading] = useState<boolean>(true)
    const [note, setNote] = useState<NoteData>({ blocks: [], visibility: "private" })
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { user } = useCurrentUserStore()
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
                    <div className="max-w-2xl w-full m-auto pb-4">
                        <div className="p-2 flex gap-2 justify-between items-center" >
                            <div className=" px-3 py-2 flex flex-col ">
                                <div className="flex items-center  text-gray-500">
                                    <span ><NoteTime time={note.created_at ?? ""} /></span>
                                    <span><Dot size={16} /></span>
                                    <span className="text-orange-500">{user?.name}</span>
                                </div>
                                <div className=" inline-flex gap-1">
                                </div>
                            </div>
                            <div className="text-gray-500 flex">
                                <button className="p-3">
                                    {
                                        note.visibility == "private" ? <><Lock size={16} /></>
                                            : note.visibility == "public" ? <><Globe size={16} /></>
                                                : <><Users2 size={16} /></>
                                    }
                                </button>
                                <Link to={"./edit"} className="flex gap-3 p-3 items-center " >
                                    <Pencil size={16} />
                                </Link>
                            </div>
                        </div>
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
