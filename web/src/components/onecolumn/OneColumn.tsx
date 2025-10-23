import { FC, ReactNode } from "react"

interface Props {
    children: ReactNode
}

const OneColumn: FC<Props> = ({ children }) => {
    return <div className="px-4 xl:px-0 xl:pr-4">
        {children}
    </div>
}

export default OneColumn