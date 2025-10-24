import { FC, ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { NoteData } from "@/api/note"
import FullNote from "../fullnote/FullNote"
import Editor from "../editor/Editor"
import NoteTime from "../notetime/NoteTime"
import VisibilityLabel from "../visibilitylabel/VisibilityLabel"
import TransitionWrapper from "../transitionwrapper/TransitionWrapper"

interface NoteDetailViewProps {
    note: NoteData | null
    backLink: string
    title: string
    authorName?: string
    menu?: ReactNode
    isEditable?: boolean
    onChange?: (data: any) => void
}

const NoteDetailView: FC<NoteDetailViewProps> = ({ note, backLink, title, authorName, menu, isEditable = false, onChange }) => {
    return (
        <TransitionWrapper className="px-4 bg-white dark:bg-neutral-800 w-full">
            {note && (
                <div className="flex flex-col min-h-dvh">
                    <div className="py-2 px-4 sm:px-0 flex items-center justify-between border-b xl:border-b-0">
                        <div className="flex items-center gap-2">
                            <Link to={backLink} className="inline-flex p-3 rounded-full">
                                <ChevronLeft size={20} />
                            </Link>
                            <div className="text-lg font-semibold">{title}</div>
                        </div>
                        {menu && <div className="inline-flex">{menu}</div>}
                    </div>
                    <div className="flex">
                        <div className="max-w-2xl w-full m-auto">
                            <div className="px-4 pt-4 pb-2 flex gap-2 items-center">
                                <span className="flex items-center rounded text-gray-500">
                                    <VisibilityLabel value={note.visibility} />
                                </span>
                                <span className="text-gray-500">
                                    {note && <NoteTime time={note.updated_at ?? ""} />}
                                </span>
                                {authorName && (
                                    <span className="text-orange-500">{authorName}</span>
                                )}
                            </div>
                            <div className="pb-10">
                                {isEditable && onChange ? (
                                    <Editor note={note} onChange={onChange} />
                                ) : (
                                    <FullNote note={note} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TransitionWrapper>
    )
}

export default NoteDetailView