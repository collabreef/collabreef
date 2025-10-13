import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { useEffect, useState } from "react"
import { AIGenerateRequest, AIGenerateResponse } from "../../../../types/ai"
import { Copy, Check, RefreshCw, Trash2 } from "lucide-react"
import { GenCommand } from "../../../../types/user"

const AIGenerationComponent: React.FC<NodeViewProps> = ({ node, extension, updateAttributes, deleteNode }) => {
    const [result, setResult] = useState<AIGenerateResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    const command = node.attrs.command as GenCommand
    const selectedText = node.attrs.selectedText || ''
    const selectedImages = node.attrs.selectedImages

    // Shared generation logic
    const performGeneration = async () => {
        setLoading(true)
        setError(null)
        setElapsedTime(0)

        let timer: NodeJS.Timeout
        let startTime = Date.now()

        // Start timer
        timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)

        try {
            const req: AIGenerateRequest = {
                modality: command.modality,
                model: command.model,
                prompt: command.prompt,
                image_base64s: selectedImages
            }

            const response = await extension.options.generate(req)
            setResult(response)
            updateAttributes({ result: response, command: command })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed')
        } finally {
            setLoading(false)
            setRegenerating(false)
            if (timer) clearInterval(timer)
        }
    }

    useEffect(() => {
        if (result) return
        performGeneration()
    }, [command, selectedText, extension])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isTextOutput = command?.modality === 'text2text' || command?.modality === 'textimage2text'
    const isImageOutput = command?.modality === 'text2image' || command?.modality === 'textimage2image'

    const handleCopy = async () => {
        try {
            if (result?.text) {
                await navigator.clipboard.writeText(result.text)
            } else if (result?.image_url) {
                await navigator.clipboard.writeText(result.image_url)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleRegenerate = async () => {
        setRegenerating(true)
        setResult(null)
        await performGeneration()
    }

    const handleDelete = () => {
        if (deleteNode) {
            deleteNode()
        }
    }

    // Render loading skeleton for text
    const renderTextSkeleton = () => (
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
    )

    // Render loading spinner for image
    const renderImageLoader = () => (
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Generating image...</span>
            </div>
        </div>
    )

    // Render action buttons
    const renderActionButtons = (isError: boolean) => (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
            <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isError ? "Retry" : "Regenerate"}
            >
                <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
                <span>{isError ? "Retry" : "Regenerate"}</span>
            </button>
            <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                title="Delete"
            >
                <Trash2 size={14} />
                <span>Delete</span>
            </button>
        </div>
    )

    return (
        <NodeViewWrapper className="ai-generation-wrapper select-none">
            <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 my-2">
                {/* Timer and Copy button in top-right corner */}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                    <div className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                        {formatTime(elapsedTime)}
                    </div>
                    {!loading && !error && result && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                            title="Copy result"
                        >
                            {copied ? (
                                <Check size={14} className="text-green-500" />
                            ) : (
                                <Copy size={14} className="text-gray-500" />
                            )}
                        </button>
                    )}
                </div>

                {/* Command name */}
                <div className=" text-sm font-medium text-gray-700 mb-3 pr-16">
                    {command?.name || 'AI Generation'}
                </div>

                {/* Loading state */}
                {loading && (
                    <div>
                        {isTextOutput && renderTextSkeleton()}
                        {isImageOutput && renderImageLoader()}
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="text-red-500 text-sm">
                        Error: {error}
                    </div>
                )}

                {/* Result state */}
                {!loading && !error && result && (
                    <div>
                        {result.text && (
                            <div className="prose prose-sm max-w-none text-gray-800">
                                {result.text}
                            </div>
                        )}
                        {result.image_url && (
                            <div className="mt-2">
                                <img
                                    src={result.image_url}
                                    alt="Generated image"
                                    className="rounded-lg max-w-full h-auto"
                                />
                            </div>
                        )}
                        {renderActionButtons(false)}
                    </div>
                )}

                {/* Error state with action buttons */}
                {error && !loading && (
                    <>
                        {renderActionButtons(true)}
                    </>
                )}
            </div>
        </NodeViewWrapper>
    )
}

export default AIGenerationComponent