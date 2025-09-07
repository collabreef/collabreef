import { FC, useState } from "react"
import { NoteData } from "../../api/note"
import BlockRenderer from "../blockrenderer/BlockRenderer"
import { ArrowDownFromLine, ArrowUpToLine } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PhotoProvider } from 'react-photo-view'

interface Props {
    note: NoteData
}

const ExpandableNote: FC<Props> = ({ note }) => {
    const { t } = useTranslation()
    const [isExpanded, setExpanded] = useState(false)

    return <>
        <PhotoProvider>
            {
                note?.blocks && note?.blocks.slice(0, 3).map((b: any, bidx: number) => (
                    <BlockRenderer key={b.id || bidx} block={b} />
                ))
            }
            {
                isExpanded && note?.blocks?.slice(3, note.blocks.length).map((b: any, bidx: number) => (
                    <BlockRenderer key={b.id || bidx} block={b} />
                ))
            }
            {
                note?.blocks && note.blocks.length < 4 && <div className="py-2"></div>
            }
            {
                note?.blocks && note.blocks.length > 3 && <button
                    onClick={() => setExpanded(!isExpanded)}
                    className="mt-2 px-4 py-1 text-sm flex justify-center items-center gap-2"
                >
                    {isExpanded ? <ArrowUpToLine size={12} /> : <ArrowDownFromLine size={12} />}
                    {isExpanded ? t("actions.collapse") : t("actions.expand")}
                </button>
            }
        </PhotoProvider>
    </>
}

export default ExpandableNote