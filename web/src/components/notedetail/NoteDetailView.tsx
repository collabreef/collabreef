import { FC, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check, Loader } from "lucide-react"
import { NoteData } from "@/api/note"
import { useTranslation } from "react-i18next"
import FullNote from "../fullnote/FullNote"
import Editor from "../editor/Editor"
import EditableDiv from "@/components/editablediv/EditableDiv"

interface NoteDetailViewProps {
    note: NoteData | null
    menu?: ReactNode
    isEditable?: boolean
    onChange?: (data: any) => void
    saveStatus?: 'idle' | 'saving' | 'saved'
}

const NoteDetailView: FC<NoteDetailViewProps> = ({ note, menu, isEditable = false, onChange, saveStatus = 'idle' }) => {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const handleTitleChange = (value: string) => {
        if (onChange) {
            onChange({ title: value })
        }
    }

    if (!note) {
        return (
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
        )
    }

    return (
        <div className="w-full">
            {note && (
                <div className="flex flex-col min-h-dvh">
                    <div className="p-2 xl:p-0 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0 xl:hidden">
                            <button onClick={() => navigate(-1)} aria-label="back" className="inline-flex p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <EditableDiv
                                key={note.id}
                                value={note.title}
                                placeholder={t("notes.untitled")}
                                className="flex-1 text-lg font-semibold border-none outline-none bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600 min-w-0"
                                onChange={handleTitleChange} />
                            {/* Save Status Indicator */}
                            {saveStatus === 'saving' && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2">
                                    <Loader className="animate-spin" size={14} />
                                    <span className="hidden sm:inline">{t('common.saving')}</span>
                                </div>
                            )}
                            {saveStatus === 'saved' && (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 px-2">
                                    <Check size={14} />
                                    <span className="hidden sm:inline">{t('widgets.saved')}</span>
                                </div>
                            )}
                            {menu && <div className="inline-flex flex-shrink-0">{menu}</div>}
                        </div>
                    </div>
                    <div className="flex">
                        <div className="w-full m-auto">
                            <div className="lg:p-4">
                                <div className="flex flex-col gap-2">
                                    <div className="hidden xl:flex xl:gap-2 p-4">
                                        <EditableDiv
                                            key={note.id}
                                            value={note.title}
                                            placeholder={t("notes.untitled")}
                                            className="flex-1 text-4xl font-semibold border-none outline-none bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600 min-w-0"
                                            onChange={handleTitleChange} />
                                        <div>
                                            {saveStatus === 'saving' && (
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                    <Loader className="animate-spin" size={16} />
                                                    <span>{t('common.saving')}</span>
                                                </div>
                                            )}
                                            {saveStatus === 'saved' && (
                                                <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                                                    <Check size={16} />
                                                    <span>{t('widgets.saved')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isEditable && onChange ?
                                        <Editor key={note.id} note={note} onChange={onChange} />
                                        : <FullNote note={note} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NoteDetailView