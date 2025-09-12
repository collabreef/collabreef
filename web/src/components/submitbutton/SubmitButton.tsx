import { FC, ReactNode } from "react";

interface Props {
    disabled: boolean
    children: ReactNode
}

const SubmitButton: FC<Props> = (props: Props) => {
    return <button
        className="w-full focus:ring-2 focus:ring-orange-700 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline disabled:opacity-50"
        type="submit"
        disabled={props.disabled}
    >
        {props.children}
    </button>
}

export default SubmitButton