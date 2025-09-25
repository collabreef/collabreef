import SidebarButton from "../../components/sidebar/SidebarButton"
import TransitionWrapper from "../../components/transitionwrapper/TransitionWrapper"
import { useTranslation } from "react-i18next"
import OpenAI from "../../components/icons/openai"
import Gemini from "../../components/icons/gemini"
import AutoSaveInput from "../../components/autosaveinput/AutoSaveInput"
import { useEffect, useState } from "react"
import { getUserSettings, updateGeminiKey, updateOpenAIKey, UserSettings } from "../../api/user-settings"
import { useCurrentUserStore } from "../../stores/current-user"
import { toast } from "../../stores/toast"
import { Edit, Loader, Trash2, X } from "lucide-react"

const ModelsPage = () => {
    const { t } = useTranslation();
    const { user } = useCurrentUserStore()
    const [userSettings, setUserSettings] = useState<UserSettings>()
    const [isOpenAIKeyEditing, setIsOpenAIKeyEditing] = useState(false)
    const [isGeminiKeyEditing, setIsGeminiKeyEditing] = useState(false)
    const [isOpenAIKeyRevoking, setIsOpenAIKeyRevoking] = useState(false)
    const [isGeminiKeyRevoking, setIsGeminiKeyRevoking] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return

            try {
                const settings = await getUserSettings(user.id);
                setUserSettings(settings);
            } catch (error) {
                toast.error(`Failed to fetch user settings:${error}`);
            }
        };

        fetchData();
    }, [user?.id]);

    const handleOpenAIKeyRevoke = async () => {
        if (!userSettings) return

        setIsOpenAIKeyRevoking(true)

        userSettings.openai_api_key = ""

        try {
            await updateOpenAIKey(userSettings)
        }
        catch {

        }

        setUserSettings({ ...userSettings })

        setIsOpenAIKeyRevoking(false)
    }

    const handleOpenAIKeySave = async (text: string) => {
        if (!userSettings) return

        userSettings.openai_api_key = text

        try {
            await updateOpenAIKey(userSettings)
        }
        catch {

        }

        setUserSettings({ ...userSettings })

        setIsOpenAIKeyEditing(false)
    }

    const handleGeminiKeyRevoke = async () => {
        if (!userSettings) return

        setIsGeminiKeyRevoking(true)

        userSettings.gemini_api_key = ""

        try {
            await updateGeminiKey(userSettings)
        }
        catch {

        }

        setUserSettings({ ...userSettings })

        setIsGeminiKeyRevoking(false)
    }

    const handleGeminiKeySave = async (text: string) => {
        if (!userSettings) return

        userSettings.gemini_api_key = text

        try {
            await updateGeminiKey(userSettings)
        }
        catch {

        }

        setUserSettings({ ...userSettings })

        setIsGeminiKeyEditing(false)
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
                                    {
                                        isOpenAIKeyEditing ? <div className="flex gap-3 w-full">
                                            <AutoSaveInput onSave={handleOpenAIKeySave} placeholder="OpenAI API KEY" />
                                            <button aria-label="edit key" onClick={() => setIsOpenAIKeyEditing(false)}><X size={16} /></button>
                                        </div>
                                            : <div className="flex items-center truncate">
                                                <button className="text-gray-500 p-2" aria-label="edit key" onClick={() => setIsOpenAIKeyEditing(true)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="text-red-500 p-2" aria-label="revoke key" onClick={handleOpenAIKeyRevoke}>
                                                    {
                                                        isOpenAIKeyRevoking ? <Loader size={16} className=" animate-spin" /> : <Trash2 size={16} />
                                                    }
                                                </button>
                                                {!userSettings?.openai_api_key ? "API Key" : userSettings?.openai_api_key}
                                            </div>
                                    }
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
                                    {
                                        isGeminiKeyEditing ? <div className="flex gap-3 w-full">
                                            <AutoSaveInput onSave={handleGeminiKeySave} placeholder="Gemini API KEY" />
                                            <button aria-label="edit key" onClick={() => setIsGeminiKeyEditing(false)}><X size={16} /></button>
                                        </div>
                                            : <div className="flex items-center truncate">
                                                <button className="text-gray-500 p-2" aria-label="edit key" onClick={() => setIsGeminiKeyEditing(true)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="text-red-500 p-2" aria-label="revoke key" onClick={handleGeminiKeyRevoke}>
                                                    {
                                                        isGeminiKeyRevoking ? <Loader size={16} className=" animate-spin" /> : <Trash2 size={16} />
                                                    }
                                                </button>
                                                {!userSettings?.gemini_api_key ? "API Key" : userSettings?.gemini_api_key}
                                            </div>
                                    }
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