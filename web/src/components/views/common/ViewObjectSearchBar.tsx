import { Search } from "lucide-react"

interface ViewObjectSearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onFocus?: () => void
    onBlur?: () => void
}

const ViewObjectSearchBar = ({
    value,
    onChange,
    placeholder = "Search",
    onFocus,
    onBlur
}: ViewObjectSearchBarProps) => {
    return (
        <div
            className="flex items-center gap-2 p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex-1"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            <span>
                <Search size={16} className="text-gray-400" />
            </span>
            <input
                className="bg-inherit outline-none flex-1"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                type="text"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </div>
    )
}

export default ViewObjectSearchBar