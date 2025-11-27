import { FC } from "react";
import { Visibility } from "@/types/visibility";

interface Props {
    value: string
    onChange: (visibility: Visibility) => void
}

const VisibilitySelect: FC<Props> = ({ value }) => {
    return <div>
        {value}
    </div>
};

export default VisibilitySelect;
