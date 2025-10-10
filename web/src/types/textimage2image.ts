export interface TextImage2ImageModel {
    id: string;
    name: string;
    provider: string;
}

export interface TextImage2ImageGenerateRequest {
    provider: string;
    model: string;
    prompt: string;
    image_url?: string;
    image_base64?: string;
    mask_url?: string;
    mask_base64?: string;
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
}

export interface TextImage2ImageGenerateResponse {
    image_url: string;
}