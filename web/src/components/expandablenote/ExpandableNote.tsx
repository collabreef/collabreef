import { FC, useState } from "react"
import { NoteData } from "@/api/note"
import { ArrowDownFromLine, ArrowUpToLine } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PhotoProvider } from 'react-photo-view'
import Renderer, { ConvertToNode } from "../renderer/Renderer"

interface Props {
    note: NoteData
}

const ExpandableNote: FC<Props> = ({ note }) => {
    const { t } = useTranslation()
    const [isExpanded, setExpanded] = useState(false)

    return <>
        <PhotoProvider>
            <Renderer json={ConvertToNode({ ...note, blocks: note?.blocks?.slice(0, 3) ?? null })} />
            {
                isExpanded && <Renderer json={ConvertToNode({ ...note, blocks: note?.blocks?.slice(3, note.blocks.length) ?? null })} />
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