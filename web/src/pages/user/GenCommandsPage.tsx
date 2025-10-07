import SidebarButton from "../../components/sidebar/SidebarButton"
import TransitionWrapper from "../../components/transitionwrapper/TransitionWrapper"
import { useTranslation } from "react-i18next"
import { useCurrentUserStore } from "../../stores/current-user"
import { Plus, Search, } from "lucide-react"
import { GenCommand } from "../../types/user"

const GenCommandsPage = () => {
    const { t } = useTranslation();
    const { user } = useCurrentUserStore()

    const commnads: GenCommand[] = [
        {
            container_type: "editorTextSelectionMenu",
            name: "翻譯成繁體中文",
            prompt: "把{{input}}翻譯成繁體中文",
            gen_type: "text-to-text",
            model: ""
        },
        {
            container_type: "editorTextSelectionMenu",
            name: "摘要內容",
            prompt: "把{{input}}做總結",
            gen_type: "text-to-text",
            model: ""
        },
    ]

    return <TransitionWrapper
        className="w-full"
    >
        <div className="flex flex-col min-h-screen">
            <div className="py-2.5 flex items-center justify-between ">
                <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                    <SidebarButton />
                    {t("menu.gencommands")}
                </div>
            </div>
            <div className="grow flex justify-start  pb-6">
                <div className="flex-1">
                    <div className="w-full flex flex-col gap-4 max-w-3xl">
                        <div className="flex items-center gap-2">
                            <div className="bg-white rounded-lg border flex-1 p-3 flex items-center gap-2">
                                <Search size={16} />
                                <input className="flex-1 bg-transparent" placeholder="Search gen command" aria-label="search command" />
                            </div>
                            <button className="flex gap-2 items-center px-4 py-3 rounded-lg bg-amber-600 text-white">
                                <Plus size={16} />
                                {t("actions.new")}
                            </button>
                        </div>
                        {
                            commnads.map(c => (
                                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm w-full p-5">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col">
                                            <div className="text-xs font-semibold text-gray-500">
                                                {t("pages.genCommands.name")}
                                            </div>
                                            <div>
                                                {c.name}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-xs font-semibold text-gray-500">
                                                {t("pages.genCommands.containerType")}
                                            </div>
                                            <div>
                                                {c.container_type}
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-wrap">
                                            <div className="text-xs font-semibold text-gray-500">
                                                {t("pages.genCommands.prompt")}
                                            </div>
                                            <textarea aria-label="prompt textarea" className="w-full border resize-none p-3 rounded">
                                                {c.prompt}
                                            </textarea>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col flex-1">
                                                <div className="text-xs font-semibold text-gray-500">
                                                    {t("pages.genCommands.genType")}
                                                </div>
                                                <select aria-label="output type" className="border p-2 rounded">
                                                    <option>text to text</option>
                                                    <option>text to image</option>
                                                    <option>text and image to text</option>
                                                    <option>text and image to image</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <div className="text-xs font-semibold text-gray-500">
                                                    {t("pages.genCommands.model")}
                                                </div>
                                                <select aria-label="model" className="border p-2 rounded">
                                                    <option>gpt-4</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    </TransitionWrapper>
}

export default GenCommandsPage