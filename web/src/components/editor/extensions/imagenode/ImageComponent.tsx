import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { Image } from "lucide-react"
import { useRef } from "react"
import { twMerge } from "tailwind-merge"

const ImageComponent: React.FC<NodeViewProps> = ({ node, extension, updateAttributes, selected }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const { src, name } = node.attrs

    const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const result = await extension.options?.upload(file)

        if (result?.src) {
            updateAttributes({
                src: result.src,
                name: result.name
            })
        }
    }

    if (!src) {
        return (
            <NodeViewWrapper className="image-node select-none border rounded p-2 bg-gray-100">
                <button
                    className="rounded w-full h-32 flex gap-3 items-center justify-center"
                    onClick={() => inputRef.current?.click()}
                >
                    <Image size={20} />
                    Upload
                </button>
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    aria-label="upload"
                    onChange={handleSelectFile}
                />
            </NodeViewWrapper>
        )
    }

    return (
        <NodeViewWrapper className={twMerge("image-node select-none rounded box-border flex items-center gap-2 bg-gray-50",selected ? "border-4 border-sky-300":"")}>
            <img src={src} alt={name} />
        </NodeViewWrapper>
    )
}

export default ImageComponent