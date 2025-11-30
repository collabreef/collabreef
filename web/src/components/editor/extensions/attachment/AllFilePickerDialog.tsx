import { FC, useState, useEffect, useCallback } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, Loader2, File, FileText, FileArchive, FileAudio, FileVideo, FileImage, Code } from "lucide-react"
import { FileInfo } from "@/api/file"

interface AllFilePickerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    listFiles: (workspaceId: string, query?: string, ext?: string, pageSize?: number, pageNumber?: number) => Promise<{ files: FileInfo[] }>
    onSelect: (file: FileInfo) => void
}

const AllFilePickerDialog: FC<AllFilePickerDialogProps> = ({
    open,
    onOpenChange,
    workspaceId,
    listFiles,
    onSelect
}) => {
    const [files, setFiles] = useState<FileInfo[]>([])
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
            const result = await listFiles(workspaceId, debouncedQuery, '', 50, 1)
            setFiles(result.files || [])
        } catch (error) {
            console.error('Failed to load files:', error)
            setFiles([])
        } finally {
            setIsLoading(false)
        }
    }, [workspaceId, debouncedQuery, listFiles])

    useEffect(() => {
        if (open) {
            loadFiles()
        }
    }, [open, loadFiles])

    const handleSelectFile = (file: FileInfo) => {
        onSelect(file)
        onOpenChange(false)
    }

    const getFileIcon = (ext: string) => {
        const lowerExt = ext.toLowerCase()

        // Images
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(lowerExt)) {
            return <FileImage size={20} className="text-blue-500" />
        }
        // Videos
        if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(lowerExt)) {
            return <FileVideo size={20} className="text-purple-500" />
        }
        // Audio
        if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(lowerExt)) {
            return <FileAudio size={20} className="text-green-500" />
        }
        // Archives
        if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(lowerExt)) {
            return <FileArchive size={20} className="text-orange-500" />
        }
        // Code
        if (['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.css', '.html', '.json', '.xml', '.yaml', '.yml'].includes(lowerExt)) {
            return <Code size={20} className="text-pink-500" />
        }
        // Text
        if (['.txt', '.md', '.pdf', '.doc', '.docx'].includes(lowerExt)) {
            return <FileText size={20} className="text-gray-500" />
        }

        return <File size={20} className="text-gray-400" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[700px] z-50 max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        Select File from Files
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

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : files.length > 0 ? (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <button
                                    key={file.id}
                                    onClick={() => handleSelectFile(file)}
                                    className="w-full p-3 rounded-lg border dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-3 text-left"
                                >
                                    {getFileIcon(file.ext)}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{file.original_name}</div>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <File size={48} className="mb-4" />
                            <p>No files found</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Dialog.Close asChild>
                            <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                Close
                            </button>
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default AllFilePickerDialog
