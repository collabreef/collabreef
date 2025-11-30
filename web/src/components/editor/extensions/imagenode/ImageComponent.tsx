import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { Image, Loader2, FolderOpen, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import FilePickerDialog from "./FilePickerDialog"
import { FileInfo } from "@/api/file"

const ImageComponent: React.FC<NodeViewProps> = ({ node, extension, updateAttributes, selected }) => {
    const [isUploading, setIsUploading] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const { src, name } = node.attrs

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)

        const result = await extension.options?.upload(file)

        setIsUploading(false)

        if (result?.src) {
            updateAttributes({
                src: result.src,
                name: result.name
            })
        }
    }

    const handleSelectExistingFile = (file: FileInfo) => {
        const workspaceId = extension.options?.workspaceId
        if (workspaceId) {
            updateAttributes({
                src: `/api/v1/workspaces/${workspaceId}/files/${file.name}`,
                name: file.original_name
            })
        }
    }

    if (!src) {
        return (
            <NodeViewWrapper className="image-node select-none border rounded p-2 bg-gray-100">
                <div className="flex gap-2 w-full h-32">
                    <button
                        className="flex-1 rounded flex flex-col gap-2 items-center justify-center hover:bg-gray-200 transition-colors"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span className="text-sm">Uploading</span>
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                <span className="text-sm">Upload New</span>
                            </>
                        )}
                    </button>
                    <button
                        className="flex-1 rounded flex flex-col gap-2 items-center justify-center hover:bg-gray-200 transition-colors"
                        onClick={() => setIsPickerOpen(true)}
                        disabled={isUploading || !extension.options?.workspaceId}
                    >
                        <FolderOpen size={20} />
                        <span className="text-sm">Choose Existing</span>
                    </button>
                </div>
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    aria-label="upload"
                    accept="image/*"
                    onChange={handleUploadFile}
                />
                {extension.options?.workspaceId && (
                    <FilePickerDialog
                        open={isPickerOpen}
                        onOpenChange={setIsPickerOpen}
                        workspaceId={extension.options.workspaceId}
                        listFiles={extension.options.listFiles}
                        onSelect={handleSelectExistingFile}
                    />
                )}
            </NodeViewWrapper>
        )
    }

    return (
        <NodeViewWrapper >
            <img src={src} className={twMerge("image-node select-none rounded box-border w-auto", selected ? "border-4 border-sky-300" : "")} alt={name} />
        </NodeViewWrapper>
    )
}

export default ImageComponent