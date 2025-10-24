import { FC } from "react"
import { NoteData } from "@/api/note"
import NoteTime from "../notetime/NoteTime"
import VisibilityLabel from "../visibilitylabel/VisibilityLabel"
import { useTranslation } from "react-i18next"
import { Info, ChevronRight } from "lucide-react"

interface NoteDetailSidebarProps {
    note: NoteData
    onClose?: () => void
}

const NoteDetailSidebar: FC<NoteDetailSidebarProps> = ({ note, onClose }) => {
    const { t } = useTranslation()

    return (
        <div className="max-w-sm h-screen overflow-y-auto sticky top-0 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            {/* Sticky Header with Close Button */}
            <div className=" border-b dark:border-neutral-700 px-4 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <Info size={18} />
                    <div className="text-lg font-semibold">{t("pages.noteDetail.note")}</div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
                        title="Hide Info"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Visibility Section */}
                <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t("common.visibility")}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        <VisibilityLabel value={note.visibility} showText={true} />
                    </div>
                </div>

                {/* Creator Section */}
                {note.created_by && (
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t("common.creator")}
                        </div>
                        <div className="text-orange-500">
                            {note.created_by}
                        </div>
                    </div>
                )}

                {/* Last Updated Section */}
                <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t("common.lastUpdated")}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        <NoteTime time={note.updated_at ?? ""} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NoteDetailSidebar