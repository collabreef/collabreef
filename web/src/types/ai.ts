export interface AIModel {
    id: string;
    name: string;
    provider: string;
    modalities: AIModality[]; // e.g., ["text2text", "textimage2text"]
}

export type AIModality = "text2text" | "text2image" | "textimage2text" | "textimage2image";

export interface AIGenerateRequest {
    modality: AIModality;
    model: string;
    prompt: string;
    image_base64s?: string[];
}

export interface AIGenerateResponse {
    modality: AIModality;
    text?: string;
    image_url?: string;
}