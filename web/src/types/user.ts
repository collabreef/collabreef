export interface User {
    id: string;
    name: string;
    email: string;
    preferences: Preferences;
    gen_commands: GenCommand[];
}

interface Preferences {
    lang: string
    theme: Theme
} 

export type Theme = "light" | "dark";

type TriggerType = "editorTextSelection" | "editorImageSelection"
type GenType = "text-to-text" | "text-to-image" | "text-and-image-to-text" | "text-and-image-to-image"

export interface GenCommand {
    id?: string
    trigger_type: TriggerType
    name: string
    prompt: string
    gen_type: GenType
    model: string
}