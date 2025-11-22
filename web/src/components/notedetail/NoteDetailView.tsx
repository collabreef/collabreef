import { FC, ReactNode, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { NoteData } from "@/api/note"
import { useTranslation } from "react-i18next"
import FullNote from "../fullnote/FullNote"
import Editor from "../editor/Editor"

interface NoteDetailViewProps {
    note: NoteData | null
    menu?: ReactNode
    isEditable?: boolean
    onChange?: (data: any) => void
}

const NoteDetailView: FC<NoteDetailViewProps> = ({ note, menu, isEditable = false, onChange }) => {
    const navigate = useNavigate()
    const { t } = useTranslation("editor")
    const [title, setTitle] = useState(note?.title || '')

    useEffect(() => {
        setTitle(note?.title || '')
    }, [note?.title])

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        if (onChange) {
            onChange({ title: newTitle })
        }
    }

    return (
        <div className="w-full">
            {note && (
                <div className="flex flex-col min-h-dvh">
                    <div className="p-2 xl:p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button onClick={() => navigate(-1)} aria-label="back" className="inline-flex xl:hidden p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            {isEditable ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder={t("titlePlaceholder") || "Untitled"}
                                    className="flex-1 text-lg font-semibold border-none outline-none bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600 min-w-0"
                                />
                            ) : (
                                <div className="text-lg font-semibold truncate">{title || ""}</div>
                            )}
                        </div>
                        {menu && <div className="inline-flex flex-shrink-0">{menu}</div>}
                    </div>
                    <div className="flex">
                        <div className="max-w-2xl w-full m-auto">
                            <div className="lg:px-4 lg:py-4">
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