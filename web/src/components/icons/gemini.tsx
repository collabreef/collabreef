import { FC } from "react"

interface Props {
    className: string
}

const Gemini: FC<Props> = ({ className }) => {
    return <>
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 512 512">
            <radialGradient id="a" cx="-37.129" cy="650.866" r="32" gradientTransform="matrix(16.1326 5.4553 43.7005 -129.2322 -27793.309 84523.438)" gradientUnits="userSpaceOnUse">
                <stop offset=".067" stopColor="#9168c0" />
                <stop offset=".343" stopColor="#5684d1" />
                <stop offset=".672" stopColor="#1ba1e3" />
            </radialGradient>
            <path d="M512 256.5c-137.5 8.4-247.1 118-255.5 255.5h-1C247.1 374.5 137.5 264.9 0 256.5v-1c137.5-8.4 247.1-118 255.5-255.5h1c8.4 137.5 118 247.1 255.5 255.5z" />
        </svg>
    </>
}

export default Gemini