export interface Text2ImageModel {
    id: string;
    name: string;
    provider: string;
}

export interface Text2ImageGenerateRequest {
    provider: string;
    model: string;
    prompt: string;
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
}

export interface Text2ImageGenerateResponse {
    image_url: string;
}