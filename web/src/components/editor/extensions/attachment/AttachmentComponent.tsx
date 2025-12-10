import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { DownloadIcon, Loader2, FolderOpen, Upload, Trash2, Edit3, FileIcon } from "lucide-react"
import { useRef, useState } from "react"
import AllFilePickerDialog from "./AllFilePickerDialog"
import { FileInfo } from "@/api/file"

const AttachmentComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, extension, editor, deleteNode, selected }) => {
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
      <NodeViewWrapper className="file-node select-none border dark:border-neutral-700 rounded p-2 bg-gray-100 dark:bg-neutral-800">
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
          onChange={handleUploadFile}
        />
        {extension.options?.workspaceId && (
          <AllFilePickerDialog
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
        className={`file-node select-none rounded-lg p-3 flex items-center gap-3 transition-all ${
          selected
            ? 'border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
        }`}
        onMouseEnter={() => isEditable && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <FileIcon size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 dark:text-blue-400 hover:underline flex-1 truncate"
        >
          {name || 'Unnamed file'}
        </a>
        <div className="flex items-center gap-1">
          <a
            href={src}
            download={name}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded transition-colors"
            title="Download file"
          >
            <DownloadIcon size={16} />
          </a>
          {isEditable && (showActions || selected) && (
            <>
              <button
                onClick={handleReselect}
                className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded transition-colors"
                title="Reselect file"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Delete file"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
        {extension.options?.workspaceId && (
          <AllFilePickerDialog
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

export default AttachmentComponent