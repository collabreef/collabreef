import { AIModality } from "./ai";

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

export type ContainerType = "editorTextSelectionMenu" | "editorImageSelectionMenu" | "notePageMenu"

export interface GenCommand {
    id?: string
    container_type: ContainerType
    name: string
    prompt: string
    modality: AIModality
    model: string
}