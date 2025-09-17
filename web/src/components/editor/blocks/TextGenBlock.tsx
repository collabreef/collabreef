import { FC, useState } from "react";
import { WandSparkles } from "lucide-react";

type TextGenBlockData = {
    model?: string;
    prompt?: string;
    text?: string
}

interface TextGenBlockProps {
    data: TextGenBlockData
    onChange: (data: TextGenBlockData) => void
    onGenerate: (data: string) => void
}

const TextGenBlock: FC<TextGenBlockProps> = ({ data, onChange, onGenerate }) => {
    const [models] = useState<string[]>([]);
    const [model, setModel] = useState(data.model || "");
    const [prompt, setPrompt] = useState(data.prompt || "");
    const [text] = useState(data.text || "");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        //if (!model || !prompt) return;
        setLoading(true);
        try {
            //const res = await axios.post("/api/v1/GenText", { model, prompt });

            onGenerate(prompt);
            onChange({ model, prompt, text });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-2 border rounded-xl flex flex-col sm:flex-row gap-2 flex-wrap max-w-full">
            <input
                autoFocus
                className="p-2 flex-1 dark:bg-neutral-900"
                placeholder="Enter prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex justify-between gap-2">

                <select
                    aria-label="select model"
                    className="rounded-xl px-2 dark:border dark:bg-neutral-900"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                >
                    <option value="">Select model...</option>
                    {models.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
                <button
                    aria-label="generate"
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-center items-center w-10 h-10 p-2 border rounded-full"
                    disabled={loading}
                >
                    <WandSparkles size={14} />
                </button>
            </div>
        </div>
    );
}

export default TextGenBlock