export interface AIModel {
    id: string;
    name: string;
    provider: string;
    modalities: AIModality[]; // e.g., ["text2text", "textimage2text"]
}

export type AIModality = "text2text" | "text2image" | "textimage2text" | "textimage2image";

export interface AIGenerateRequest {
    modality: AIModality;
    provider: string;
    model: string;
    prompt: string;
    system_prompt?: string;
    image_urls?: string[];
    image_base64s?: string[];
    mask_url?: string;
    mask_base64?: string;
    temperature?: number;
    max_tokens?: number;
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
}

export interface AIGenerateResponse {
    modality: AIModality;
    text?: string;
    image_url?: string;
}