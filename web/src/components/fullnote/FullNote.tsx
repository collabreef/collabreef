import { FC } from "react"
import { NoteData } from "../../api/note"
import BlockRenderer from "../blockrenderer/BlockRenderer"

interface Props {
    note: NoteData
}

const FullNote: FC<Props> = ({ note }) => {
    return <>
        {
            note.blocks && note.blocks.map(x => <BlockRenderer block={x} />)
        }
    </>
}

export default FullNote