import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { Loader2, FolderOpen, Upload, Trash2, Edit3 } from "lucide-react"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import FilePickerDialog from "./FilePickerDialog"
import { FileInfo } from "@/api/file"
import { PhotoView } from "react-photo-view"

const ImageComponent: React.FC<NodeViewProps> = ({ node, extension, updateAttributes, selected, editor, deleteNode }) => {
    const [isUploading, setIsUploading] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const { src, name } = node.attrs
    const isEditable = editor.isEditable

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

    const handleReselect = () => {
        setIsPickerOpen(true)
    }

    const handleDelete = () => {
        deleteNode()
    }

    if (!src) {
        return (
            <NodeViewWrapper className="image-node select-none border dark:border-neutral-700 rounded p-2 bg-gray-100 dark:bg-neutral-800">
                <div className="flex gap-2 w-full h-32">
                    <button
                        className="flex-1 rounded flex flex-col gap-2 items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-700 dark:text-gray-300"
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
                        className="flex-1 rounded flex flex-col gap-2 items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-700 dark:text-gray-300"
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
        <NodeViewWrapper>
            <div
                className="relative inline-block group"
                onMouseEnter={() => isEditable && setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
            >
                <PhotoView src={src}>
                    <img
                        src={src}
                        className={twMerge(
                            "image-node select-none rounded box-border w-auto max-w-full"
                        )}
                        alt={name}
                    />
                </PhotoView>
                {isEditable && (showActions || selected) && (
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button
                            onClick={handleReselect}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-600 transition-colors"
                            title="Reselect image"
                        >
                            <Edit3 size={16} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-600 transition-colors"
                            title="Delete image"
                        >
                            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}
                {extension.options?.workspaceId && (
                    <FilePickerDialog
                        open={isPickerOpen}
                        onOpenChange={setIsPickerOpen}
                        workspaceId={extension.options.workspaceId}
                        listFiles={extension.options.listFiles}
                        onSelect={handleSelectExistingFile}
                    />
                )}
            </div>
        </NodeViewWrapper>
    )
}

export default ImageComponent