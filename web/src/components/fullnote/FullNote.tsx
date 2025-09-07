import { FC } from "react"
import { NoteData } from "../../api/note"
import BlockRenderer from "../blockrenderer/BlockRenderer"
import { PhotoProvider } from 'react-photo-view'

interface Props {
    note: NoteData
}

const FullNote: FC<Props> = ({ note }) => {
    return <>
        <PhotoProvider>
            {
                note.blocks && note.blocks.map(x => <BlockRenderer block={x} />)
            }
        </PhotoProvider>
    </>
}

export default FullNote