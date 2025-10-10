export interface Text2TextModel {
    id: string;
    name: string;
    provider: string;
}

export interface Text2TextGenerateRequest {
    provider: string;
    model: string;
    prompt: string;
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
}

export interface Text2TextGenerateResponse {
    output: string;
}