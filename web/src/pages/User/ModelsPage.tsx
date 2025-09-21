import SidebarButton from "../../components/sidebar/SidebarButton"
import TransitionWrapper from "../../components/transitionwrapper/TransitionWrapper"
import { useTranslation } from "react-i18next"
import OpenAI from "../../components/icons/openai"
import Gemini from "../../components/icons/gemini"
import AutoSaveInput from "../../components/autosaveinput/AutoSaveInput"
import { useState } from "react"

const ModelsPage = () => {
    const { t } = useTranslation();
    const [openaiKey, setOpenAIKey] = useState("openai")
    const [geminiKey, setGeminiKey] = useState("gemini")

    const handleOpenAIKeySave = async (text: string) => {
    }

    const handleGeminiKeySave = async (text: string) => {
    }

    return <TransitionWrapper
        className="w-full"
    >
        <div className="flex flex-col min-h-screen">
            <div className="py-2.5 flex items-center justify-between ">
                <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                    <SidebarButton />
                    {t("menu.models")}
                </div>
            </div>
            <div className="grow flex justify-start">
                <div className="flex-1">
                    <div className="w-full flex flex-col gap-4">
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm w-full p-5 max-w-3xl">
                            <div className="flex flex-col gap-4">
                                <div className="text-lg font-semibold flex items-center gap-2">
                                    <OpenAI className="w-5 h-5 dark:fill-white" />
                                    OpenAI
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <AutoSaveInput value={openaiKey} onSave={handleOpenAIKeySave} placeholder="OpenAI API KEY" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm w-full p-5 max-w-3xl">
                            <div className="flex flex-col gap-4">
                                <div className="text-lg font-semibold flex items-center gap-2">
                                    <Gemini className="w-5 h-5 dark:fill-white" />
                                    Gemini
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <AutoSaveInput value={geminiKey} onSave={handleGeminiKeySave} placeholder="Gemini API KEY" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </TransitionWrapper>
}

export default ModelsPage