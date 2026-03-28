import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { Loader2, FolderOpen, Upload, Trash2, Edit3, ChevronUp, ChevronDown } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { twMerge } from "tailwind-merge"
import VideoPickerDialog from "./VideoPickerDialog"
import { FileInfo } from "@/api/file"

const VideoNodeComponent: React.FC<NodeViewProps> = ({ node, extension, updateAttributes, selected, editor, deleteNode, getPos }) => {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const wasEditableRef = useRef<boolean>(true)
    const { src, name } = node.attrs
    const isEditable = editor.isEditable

    useEffect(() => {
        if (selected) {
            wasEditableRef.current = editor.isEditable
            editor.setEditable(false)
        } else {
            if (wasEditableRef.current) {
                editor.setEditable(true)
            }
        }

        return () => {
            if (wasEditableRef.current && !editor.isEditable) {
                editor.setEditable(true)
            }
        }
    }, [selected, editor])

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setUploadProgress(0)

        try {
            const result = await extension.options?.upload(file, (progress: any) => {
                setUploadProgress(progress)
            })

            if (result?.src) {
                updateAttributes({
                    src: result.src,
                    name: result.name
                })
            }
        } catch (error) {
            console.error('Failed to upload video:', error)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            if (inputRef.current) inputRef.current.value = ''
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

    const handleMoveUp = () => {
        const pos = getPos()
        if (pos === undefined) return
        const { state } = editor
        const $pos = state.doc.resolve(pos)
        if ($pos.index() === 0) return
        const nodeBefore = $pos.nodeBefore
        if (!nodeBefore) return
        editor.view.dispatch(
            state.tr.replaceWith(pos - nodeBefore.nodeSize, pos + node.nodeSize, [node, nodeBefore])
        )
    }

    const handleMoveDown = () => {
        const pos = getPos()
        if (pos === undefined) return
        const { state } = editor
        const $pos = state.doc.resolve(pos)
        if ($pos.index() >= $pos.parent.childCount - 1) return
        const nodeAfterPos = pos + node.nodeSize
        const nodeAfter = state.doc.resolve(nodeAfterPos).nodeAfter
        if (!nodeAfter) return
        editor.view.dispatch(
            state.tr.replaceWith(pos, nodeAfterPos + nodeAfter.nodeSize, [nodeAfter, node])
        )
    }

    if (!src) {
        return (
            <NodeViewWrapper className="video-node select-none border dark:border-neutral-700 rounded p-2 bg-gray-100 dark:bg-neutral-800">
                <div className="flex gap-2 w-full h-32">
                    <button
                        className="flex-1 rounded flex flex-col gap-2 items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-700 dark:text-gray-300"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span className="text-sm">Uploading {uploadProgress}%</span>
                                <div className="w-full bg-gray-300 dark:bg-neutral-700 rounded-full h-2 mt-1">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
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
                    aria-label="upload video"
                    accept="video/*"
                    onChange={handleUploadFile}
                />
                {extension.options?.workspaceId && (
                    <VideoPickerDialog
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
                className={twMerge(
                    "relative group rounded overflow-hidden",
                    selected && "ring-2 ring-blue-500"
                )}
                onMouseEnter={() => isEditable && setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
            >
                <video
                    src={src}
                    className="video-node select-none rounded w-full max-w-full"
                    controls
                    title={name}
                />
                {isEditable && (showActions || selected) && (
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button
                            onClick={handleMoveUp}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-600 transition-colors"
                            title="Move up"
                        >
                            <ChevronUp size={16} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={handleMoveDown}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-600 transition-colors"
                            title="Move down"
                        >
                            <ChevronDown size={16} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={() => setIsPickerOpen(true)}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-600 transition-colors"
                            title="Reselect video"
                        >
                            <Edit3 size={16} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={() => deleteNode()}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-600 transition-colors"
                            title="Delete video"
                        >
                            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}
                {extension.options?.workspaceId && (
                    <VideoPickerDialog
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

export default VideoNodeComponent
