import { FC } from "react"
import { NoteData } from "@/api/note"
import { PhotoProvider } from 'react-photo-view'
import Renderer from "../renderer/Renderer"

interface Props {
    note: NoteData
}

const FullNote: FC<Props> = ({ note }) => {
    return <>
        <PhotoProvider>
            {note?.title && (
                <div className="text-4xl font-bold px-4 mb-4 text-gray-900 dark:text-gray-100">
                    {note.title}
                </div>
            )}
            <Renderer content={note?.content || ''} />
        </PhotoProvider>
    </>
}

export default FullNote