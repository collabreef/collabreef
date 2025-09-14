import SidebarButton from "../../components/sidebar/SidebarButton"
import TransitionWrapper from "../../components/transitionwrapper/TransitionWrapper"
import { useTranslation } from "react-i18next"
import { updatePreferences } from "../../api/user"
import { useCurrentUserStore } from "../../stores/current-user"

const Preferences = () => {
    const {user} = useCurrentUserStore()
    const { t, i18n } = useTranslation();
    const supportedLanguages = i18n.options.supportedLngs && i18n.options.supportedLngs?.filter(l => l !== "cimode") || [];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value);
    };

    const handleSave = () =>{
        if(!user) return;
        
        user.preferences = {
            lang: i18n.language
        }

        updatePreferences(user)
    }

    return <TransitionWrapper
        className="w-full"
    >
        <div className="flex flex-col min-h-screen">
            <div className="py-2.5 flex items-center justify-between ">
                <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                    <SidebarButton />
                    {t("menu.preferences")}
                </div>
            </div>
            <div className="grow flex justify-start">
                <div className="flex-1">
                    <div className="w-full">
                        <div className="bg-white dark:bg-neutral-900 rounded shadow-sm w-full p-5 max-w-3xl">
                            <div className="flex flex-col gap-6">
                                <div className="text-lg font-semibold">
                                    {t("pages.preferences.language")}
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <select className="dark:bg-neutral-700 p-2 border" aria-label="select lang" value={i18n.language} onChange={handleChange}>
                                        {supportedLanguages.map((lng) => (
                                            <option key={lng} value={lng}>
                                                {lng.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <button onClick={handleSave} className="rounded-xl px-3 py-2 text-white bg-orange-600 font-semibold">
                                        {t("actions.save")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </TransitionWrapper>
}

export default Preferences