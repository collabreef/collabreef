import { useSidebar } from "../sidebar/SidebarProvider"
import { Link, useNavigate } from "react-router-dom"
import { Brain, CornerUpLeft, Settings2 } from 'lucide-react'
import { useTranslation } from "react-i18next"
import Tooltip from "../tooltip/Tooltip"
import BaseLayout from "../baselayout/BaseLayout"

const UserLayout = () => {
    const { t } = useTranslation()
    const { isCollapse } = useSidebar()
    const navigate = useNavigate()

    const handleGoBack = () => {
        navigate(-1)
    }

    const sidebarContent = (
        <div className="flex flex-col gap-3">
            <div className="pt-4">
                <button onClick={handleGoBack} className="p-2 flex gap-2">
                    <CornerUpLeft size={20} />
                    {!isCollapse && <>{t("menu.user")}</>}
                </button>
            </div>
            <div className=" flex flex-col gap-2 overflow-y-auto">
                <Tooltip
                    text={t("menu.preferences")}
                    side="right"
                    enabled={isCollapse}>
                    <Link to="/user/preferences" className="p-2 flex gap-2">
                        <Settings2 size={20} />
                        {!isCollapse && <>{t("menu.preferences")}</>}
                    </Link>
                </Tooltip>
                <Tooltip
                    text={t("menu.models")}
                    side="right"
                    enabled={isCollapse}>
                    <Link to="/user/models" className="p-2 flex gap-2">
                        <Brain size={20} />
                        {!isCollapse && <>{t("menu.models")}</>}
                    </Link>
                </Tooltip>
            </div>
        </div>
    )

    return <BaseLayout sidebarContent={sidebarContent} />
}

export default UserLayout