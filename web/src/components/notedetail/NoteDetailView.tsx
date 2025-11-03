import { FC, ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, ChevronLeft } from "lucide-react"
import { NoteData } from "@/api/note"
import FullNote from "../fullnote/FullNote"
import Editor from "../editor/Editor"

interface NoteDetailViewProps {
    note: NoteData | null
    backLink: string
    menu?: ReactNode
    isEditable?: boolean
    onChange?: (data: any) => void
}

const NoteDetailView: FC<NoteDetailViewProps> = ({ note, backLink, menu, isEditable = false, onChange }) => {
    return (
        <div className="w-full">
            {note && (
                <div className="flex flex-col min-h-dvh">
                    <div className="p-2 flex items-center justify-between ">
                        <div className="flex items-center gap-2">
                            <Link to={backLink} className="inline-flex p-3 rounded-full">
                                <ArrowLeft size={20} />
                            </Link>
                        </div>
                        {menu && <div className="inline-flex">{menu}</div>}
                    </div>
                    <div className="flex">
                        <div className="max-w-2xl w-full m-auto">
                            <div className="lg:px-4 pb-10">
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
        </div>
    )
}

export default NoteDetailView