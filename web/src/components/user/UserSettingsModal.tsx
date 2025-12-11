import { Dialog, Tabs } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useTheme, Theme } from "@/providers/Theme"
import { useCurrentUserStore } from "@/stores/current-user"
import { toast } from "@/stores/toast"
import { useEffect, useState } from "react"
import { updatePreferences } from "@/api/user"
import { getUserSettings, updateGeminiKey, updateOllamaKey, updateOpenAIKey, UserSettings } from "@/api/user-settings"
import Card from "@/components/card/Card"
import Select from "@/components/select/Select"
import AutoSaveInput from "@/components/autosaveinput/AutoSaveInput"
import OpenAI from "@/components/icons/openai"
import Gemini from "@/components/icons/gemini"
import Ollama from "@/components/icons/ollama"
import { Edit, Loader, Trash2, X } from "lucide-react"

interface UserSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultTab?: 'preferences' | 'models'
}

const UserSettingsModal = ({ open, onOpenChange, defaultTab = 'preferences' }: UserSettingsModalProps) => {
    const { user } = useCurrentUserStore()
    const { t, i18n } = useTranslation()
    const { theme, setTheme } = useTheme()!
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Preferences state
    const themes: Theme[] = ["light", "dark"]
    const supportedLanguages = i18n.options.supportedLngs && i18n.options.supportedLngs?.filter(l => l !== "cimode") || []

    // Models state
    const [userSettings, setUserSettings] = useState<UserSettings>()
    const [isOpenAIKeyEditing, setIsOpenAIKeyEditing] = useState(false)
    const [isGeminiKeyEditing, setIsGeminiKeyEditing] = useState(false)
    const [isOllamaKeyEditing, setIsOllamaKeyEditing] = useState(false)
    const [isOpenAIKeyRevoking, setIsOpenAIKeyRevoking] = useState(false)
    const [isGeminiKeyRevoking, setIsGeminiKeyRevoking] = useState(false)
    const [isOllamaKeyRevoking, setIsOllamaKeyRevoking] = useState(false)

    // Update active tab when defaultTab changes
    useEffect(() => {
        setActiveTab(defaultTab)
    }, [defaultTab])

    // Fetch user settings for models tab
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return

            try {
                const settings = await getUserSettings(user.id)
                setUserSettings(settings)
            } catch (error) {
                toast.error(`Failed to fetch user settings:${error}`)
            }
        }

        if (open) {
            fetchData()
        }
    }, [user?.id, open])

    // Preferences handlers
    const handleSelectedLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value)
    }

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme
        setTheme(newTheme)
    }

    const savePreferences = async () => {
        if (!user) return

        const updatedUser = {
            ...user,
            preferences: { lang: i18n.language, theme: theme }
        }

        try {
            await updatePreferences(updatedUser)
        } catch (err) {
            toast.error(t("messages.preferencesUpdateFailed"))
        }
    }

    useEffect(() => {
        if (!user || !open) return
        savePreferences()
    }, [theme, i18n.language])

    // Models handlers
    const handleOpenAIKeyRevoke = async () => {
        if (!userSettings) return
        setIsOpenAIKeyRevoking(true)
        userSettings.openai_api_key = ""
        try {
            await updateOpenAIKey(userSettings)
        } catch {
            // Error handling
        }
        setUserSettings({ ...userSettings })
        setIsOpenAIKeyRevoking(false)
    }

    const handleOpenAIKeySave = async (text: string) => {
        if (!userSettings) return
        userSettings.openai_api_key = text
        try {
            await updateOpenAIKey(userSettings)
        } catch {
            // Error handling
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
        } catch {
            // Error handling
        }
        setUserSettings({ ...userSettings })
        setIsGeminiKeyRevoking(false)
    }

    const handleGeminiKeySave = async (text: string) => {
        if (!userSettings) return
        userSettings.gemini_api_key = text
        try {
            await updateGeminiKey(userSettings)
        } catch {
            // Error handling
        }
        setUserSettings({ ...userSettings })
        setIsGeminiKeyEditing(false)
    }

    const handleOllamaKeyRevoke = async () => {
        if (!userSettings) return
        setIsOllamaKeyRevoking(true)
        userSettings.ollama_api_key = ""
        try {
            await updateOllamaKey(userSettings)
        } catch {
            // Error handling
        }
        setUserSettings({ ...userSettings })
        setIsOllamaKeyRevoking(false)
    }

    const handleOllamaKeySave = async (text: string) => {
        if (!userSettings) return
        userSettings.ollama_api_key = text
        try {
            await updateOllamaKey(userSettings)
        } catch {
            // Error handling
        }
        setUserSettings({ ...userSettings })
        setIsOllamaKeyEditing(false)
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[600px] h-[600px] max-h-[85vh] z-[1001] flex flex-col">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t("menu.userSettings") || "User Settings"}
                    </Dialog.Title>

                    <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as 'preferences' | 'models')} className="flex flex-col flex-1 min-h-0  overflow-auto">
                        <Tabs.List className="flex border-b dark:border-neutral-600 mb-4 flex-shrink-0">
                            <Tabs.Trigger
                                value="preferences"
                                className="py-2 px-3 -mb-px border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                {t("menu.preferences")}
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                value="models"
                                className="py-2 px-3 -mb-px border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                {t("menu.models")}
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content value="preferences" className="space-y-4 overflow-y-auto flex-1">
                            <Card className="w-full p-0">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">
                                            {t("pages.preferences.language")}
                                        </div>
                                        <div>
                                            <Select value={i18n.language} onChange={handleSelectedLangChange}>
                                                {supportedLanguages.map((lng) => (
                                                    <option key={lng} value={lng}>
                                                        {lng}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">
                                            {t("pages.preferences.theme")}
                                        </div>
                                        <div>
                                            <Select value={theme} onChange={handleThemeChange}>
                                                {themes.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Tabs.Content>

                        <Tabs.Content value="models" className="overflow-y-auto flex flex-col gap-6">
                            <div className="w-full">
                                <div className="flex flex-col gap-4">
                                    <div className="text-lg font-semibold flex items-center gap-2">
                                        <OpenAI className="w-5 h-5 dark:fill-white" />
                                        OpenAI
                                    </div>
                                    <div className="flex gap-3 flex-wrap flex-1">
                                        {isOpenAIKeyEditing ? (
                                            <div className="flex gap-3 w-full">
                                                <AutoSaveInput onSave={handleOpenAIKeySave} placeholder="OpenAI API KEY" />
                                                <button aria-label="edit key" onClick={() => setIsOpenAIKeyEditing(false)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 truncate">
                                                <button className="text-gray-500" aria-label="edit key" onClick={() => setIsOpenAIKeyEditing(true)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="text-red-500" aria-label="revoke key" onClick={handleOpenAIKeyRevoke}>
                                                    {isOpenAIKeyRevoking ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                                {!userSettings?.openai_api_key ? "API Key" : userSettings?.openai_api_key}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="flex flex-col gap-4">
                                    <div className="text-lg font-semibold flex items-center gap-2">
                                        <Gemini className="w-5 h-5 dark:fill-white" />
                                        Gemini
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {isGeminiKeyEditing ? (
                                            <div className="flex gap-3 w-full">
                                                <AutoSaveInput onSave={handleGeminiKeySave} placeholder="Gemini API KEY" />
                                                <button aria-label="edit key" onClick={() => setIsGeminiKeyEditing(false)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 truncate">
                                                <button className="text-gray-500" aria-label="edit key" onClick={() => setIsGeminiKeyEditing(true)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="text-red-500" aria-label="revoke key" onClick={handleGeminiKeyRevoke}>
                                                    {isGeminiKeyRevoking ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                                {!userSettings?.gemini_api_key ? "" : userSettings?.gemini_api_key}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="flex flex-col gap-4">
                                    <div className="text-lg font-semibold flex items-center gap-2 ">
                                        <Ollama className="w-5 h-5 fill-black dark:fill-white" />
                                        Ollama
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {isOllamaKeyEditing ? (
                                            <div className="flex gap-3 w-full">
                                                <AutoSaveInput onSave={handleOllamaKeySave} placeholder="Ollama API KEY" />
                                                <button aria-label="edit key" onClick={() => setIsOllamaKeyEditing(false)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 truncate">
                                                <button className="text-gray-500 " aria-label="edit key" onClick={() => setIsOllamaKeyEditing(true)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="text-red-500" aria-label="revoke key" onClick={handleOllamaKeyRevoke}>
                                                    {isOllamaKeyRevoking ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                                {!userSettings?.ollama_api_key ? "" : userSettings?.ollama_api_key}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Tabs.Content>
                    </Tabs.Root>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default UserSettingsModal
