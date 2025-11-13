import SidebarButton from "@/components/sidebar/SidebarButton"
import { useTranslation } from "react-i18next"
import { updatePreferences } from "@/api/user"
import { useCurrentUserStore } from "@/stores/current-user"
import { toast } from "@/stores/toast"
import { useTheme, Theme } from "@/providers/Theme"
import { useEffect } from "react"
import Card from "@/components/card/Card"
import Select from "@/components/select/Select"

const PreferencesPage = () => {
    const { user } = useCurrentUserStore()
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme()!;
    const themes: Theme[] = ["light", "dark"]
    const supportedLanguages = i18n.options.supportedLngs && i18n.options.supportedLngs?.filter(l => l !== "cimode") || [];

    const handleSelectedLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value);
    };
    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme;
        setTheme(newTheme)
    }

    const savePreferences = async () => {
        if (!user) return;

        const updatedUser = {
            ...user,
            preferences: { lang: i18n.language, theme: theme }
        };

        try {
            await updatePreferences(updatedUser);
        } catch (err) {
            toast.error(t("messages.preferencesUpdateFailed"));
        }
    }

    useEffect(() => {
        if (!user) return
        savePreferences()
    }, [theme, i18n.language])

    return <div
        className="px-4 xl:pl-0 w-full "
    >
        <div className="flex flex-col min-h-screen">
            <div className="py-2.5 flex items-center justify-between ">
                <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                    <SidebarButton />
                    {t("menu.preferences")}
                </div>
            </div>
            <Card className="w-full max-w-3xl">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col">

                        <div className="text-xs font-semibold text-gray-500">
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
                        <div className="text-xs font-semibold text-gray-500">
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
    </div>
}

export default PreferencesPage