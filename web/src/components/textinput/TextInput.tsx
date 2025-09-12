import { ChangeEvent, FC } from "react"

interface Props {
    id: string
    type?: string
    value: string
    title: string
    placeholder?: string 
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    required?: boolean
    className?: string
}

const TextInput: FC<Props> = (props: Props) => {
    return <input
        className={props.className ?? "appearance-none bg-white dark:text-gray-900 focus:ring-2 focus:ring-orange-600 rounded w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline"}
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        title={props.title}
        placeholder={props.placeholder}
        onChange={props.onChange}
        required={props.required ?? true}
    />
}

export default TextInput