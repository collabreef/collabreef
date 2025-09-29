import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { Wand } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { TextGenModel } from "../../../../api/tool"

const TextGenComponent: React.FC<NodeViewProps> = ({ editor, extension }) => {
    const [prompt, setPrompt] = useState("")
    const [selectedModel, setSelectedModel] = useState<TextGenModel>()
    const [models, setModels] = useState<TextGenModel[]>([])
    const { t } = useTranslation("editor")

    useEffect(() => {
        async function fetchModels() {
            const result = await extension.options?.listModels()
            return setModels(result)
        }

        fetchModels()
    }, [])

    const handleGenerate = async () => {
        const result = await extension.options?.generate(prompt, selectedModel)
        editor.commands.insertContent(result.output)
    }

    return (
        <NodeViewWrapper className="select-none">
            <div className="flex flex-col sm:flex-row gap-2 items-center rounded-3xl p-3 w-full border">
                <div className="flex gap-2 flex-1 w-full">
                    <input value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full p-2 select-none " placeholder={t("textGen.placeholder")} aria-label="prompt input" />
                </div>
                <div className="flex justify-between gap-3 w-full sm:w-auto">
                    <select className="w-24 outline-none select-none bg-white" value={selectedModel?.id} onChange={e => setSelectedModel(models.find(x => x.id == e.target.value))} aria-label="text gen models select">
                        {
                            models.map(m => (
                                <option value={m.id}>{m.name}</option>
                            ))
                        }
                    </select>
                    <button onClick={handleGenerate} className="select-none p-2 rounded-full text-white bg-gradient-to-r from-blue-600 to-indigo-600" aria-label="generate button">
                        <Wand size={16} />
                    </button>
                </div>
            </div>
        </NodeViewWrapper>
    )
}

export default TextGenComponent