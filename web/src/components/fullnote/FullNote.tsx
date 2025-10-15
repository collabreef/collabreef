import { FC } from "react"
import { NoteData } from "@/api/note"
import { PhotoProvider } from 'react-photo-view'
import Renderer, { ConvertToNode } from "../renderer/Renderer"

interface Props {
    note: NoteData
}

const FullNote: FC<Props> = ({ note }) => {
    return <>
        <PhotoProvider>
            <Renderer json={ConvertToNode(note)} />
        </PhotoProvider>
    </>
}

export default FullNote