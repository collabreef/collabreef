import { Building, Globe, Lock } from "lucide-react"
import { FC } from "react"
import { Visibility } from "@/types/visibility"
import { useTranslation } from "react-i18next"

interface Props {
    value?: Visibility
    showText?: boolean
}

const VisibilityLabel: FC<Props> = ({ value, showText = false }) => {
    const { t } = useTranslation()

    const getVisibilityConfig = (visibility?: Visibility) => {
        switch (visibility) {
            case "public":
                return {
                    icon: <Globe size={16} />,
                    text: t("common.public")
                }
            case "private":
                return {
                    icon: <Lock size={16} />,
                    text: t("common.private")
                }
            case "workspace":
                return {
                    icon: <Building size={16} />,
                    text: t("common.workspace")
                }
            default:
                return null
        }
    }

    const config = getVisibilityConfig(value)

    if (!config) {
        return <></>
    }

    if (showText) {
        return (
            <div className="flex items-center gap-2">
                {config.icon}
                <span>{config.text}</span>
            </div>
        )
    }

    return config.icon
}

export default VisibilityLabel