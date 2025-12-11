import { FC, ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface Props {
    children: ReactNode
    className?: string
}

const Card: FC<Props> = ({ children, className }) => {
    return <div className={twMerge(className, "bg-white dark:bg-neutral-800 rounded-xl shadow-sm")}>
        {children}
    </div>
}

export default Card