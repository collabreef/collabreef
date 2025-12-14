import { FC, useState, useEffect, useCallback } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, Loader2, File as FileIcon, X } from "lucide-react"
import { FileInfo } from "@/api/file"

interface MultiFilePickerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    listFiles: (workspaceId: string, query?: string, ext?: string, pageSize?: number, pageNumber?: number) => Promise<{ files: FileInfo[] }>
    onSelect: (files: FileInfo[]) => void
    fileExtensions?: string // Comma-separated extensions (e.g., ".mp3,.wav,.ogg")
    title?: string
    emptyMessage?: string
}

const MultiFilePickerDialog: FC<MultiFilePickerDialogProps> = ({
    open,
    onOpenChange,
    workspaceId,
    listFiles,
    onSelect,
    fileExtensions,
    title = "Select Files",
    emptyMessage = "No files found"
}) => {
    const [files, setFiles] = useState<FileInfo[]>([])
    const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const loadFiles = useCallback(async () => {
        if (!workspaceId) return

        setIsLoading(true)
        try {
            const result = await listFiles(workspaceId, debouncedQuery, fileExtensions, 100, 1)
            setFiles(result.files || [])
        } catch (error) {
            console.error('Failed to load files:', error)
            setFiles([])
        } finally {
            setIsLoading(false)
        }
    }, [workspaceId, debouncedQuery, listFiles, fileExtensions])

    useEffect(() => {
        if (open) {
            loadFiles()
            setSelectedFiles([])
        }
    }, [open, loadFiles])

    const toggleFileSelection = (file: FileInfo) => {
        setSelectedFiles(prev => {
            const isSelected = prev.some(f => f.id === file.id)
            if (isSelected) {
                return prev.filter(f => f.id !== file.id)
            } else {
                return [...prev, file]
            }
        })
    }

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(selectedFiles)
        onOpenChange(false)
    }

    const isFileSelected = (file: FileInfo) => {
        return selectedFiles.some(f => f.id === file.id)
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[800px] z-50 max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {title}
                    </Dialog.Title>

                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search files..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                        </div>
                    </div>

                    {/* Selected files counter */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                {selectedFiles.length} file(s) selected
                            </span>
                            <button
                                onClick={() => setSelectedFiles([])}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : files.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                            {files.map((file) => (
                                <button
                                    key={file.id}
                                    onClick={() => toggleFileSelection(file)}
                                    className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                        isFileSelected(file)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <FileIcon size={32} className="text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-gray-100 truncate w-full text-center">
                                            {file.original_name}
                                        </span>
                                    </div>
                                    {isFileSelected(file) && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                            <X size={12} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <FileIcon size={48} className="mb-4" />
                            <p>{emptyMessage}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close asChild>
                            <button type="button" className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                Cancel
                            </button>
                        </Dialog.Close>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={selectedFiles.length === 0}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm ({selectedFiles.length})
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default MultiFilePickerDialog
