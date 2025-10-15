import { Building, Globe, Lock } from "lucide-react"
import { FC } from "react"
import { Visibility } from "@/types/visibility"

interface Props {
    value?: Visibility
}
const VisibilityLabel: FC<Props> = ({ value }) => {
    if (value == "public") {
        return <Globe size={16} />
    }
    if (value == "private") {
        return <Lock size={16} />
    }
    if (value == "workspace") {
        return <Building size={16} />
    }

    return <>
    </>
}

export default VisibilityLabel