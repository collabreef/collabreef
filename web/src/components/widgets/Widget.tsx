import { FC } from "react"
import { twMerge } from "tailwind-merge"

interface Props {
    withPadding?: boolean
    children: React.ReactNode
}

const Widget: FC<Props> = ({ withPadding = true, children }) => {
    return <div className={twMerge(withPadding ? "p-3" : "", "h-full")}>
        {children}
    </div>
}

export default Widget