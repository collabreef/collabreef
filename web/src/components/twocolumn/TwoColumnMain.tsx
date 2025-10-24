import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface TwoColumnMainProps {
    children: ReactNode
    className?: string
}

export const TwoColumnMain = ({ children, className = "" }: TwoColumnMainProps) => {
    return (
        <div className={twMerge("flex-1", className)}>
            {children}
        </div>
    )
}

export default TwoColumnMain