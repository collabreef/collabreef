import { FC, ReactNode } from "react";

interface Props {
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void  
    children: ReactNode
}

const Select: FC<Props> = ({ children, value, onChange }) => {
    return <select className="dark:bg-neutral-700 px-3 py-2 rounded-lg border dark:border-none" aria-label="select" value={value} onChange={onChange}>
        {children}
    </select>
}

export default Select