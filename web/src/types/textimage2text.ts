export interface TextImage2TextModel {
    id: string;
    name: string;
    provider: string;
}

export interface TextImage2TextGenerateRequest {
    provider: string;
    model: string;
    prompt: string;
    image_urls?: string[];
    image_base64s?: string[];
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
}

export interface TextImage2TextGenerateResponse {
    output: string;
}