import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useTheme, Theme } from "@/providers/Theme"
import { useCurrentUserStore } from "@/stores/current-user"
import { toast } from "@/stores/toast"
import { useEffect } from "react"
import { updatePreferences } from "@/api/user"
import Card from "@/components/card/Card"
import Select from "@/components/select/Select"

interface UserSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const UserSettingsModal = ({ open, onOpenChange }: UserSettingsModalProps) => {
    const { user } = useCurrentUserStore()
    const { t, i18n } = useTranslation()
    const { theme, setTheme } = useTheme()!

    // Preferences state
    const themes: Theme[] = ["light", "dark"]
    const supportedLanguages = i18n.options.supportedLngs && i18n.options.supportedLngs?.filter(l => l !== "cimode") || []

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

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[600px] max-h-[85vh] z-[1001] flex flex-col">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t("menu.preferences")}
                    </Dialog.Title>

                    <div className="space-y-4 overflow-y-auto flex-1">
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
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default UserSettingsModal
