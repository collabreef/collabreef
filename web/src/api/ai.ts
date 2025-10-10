import axios from "axios";
import { AIModel, AIGenerateRequest, AIGenerateResponse } from "../types/ai";

/**
 * Unified AI API - Single endpoint for all AI modalities
 */

export const listAIModels = async (): Promise<AIModel[]> => {
    const response = await axios.get(`/api/v1/tools/ai/models`, { withCredentials: true });
    return response.data;
};

export const generateAI = async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
    const response = await axios.post(`/api/v1/tools/ai/generate`, request, { withCredentials: true });
    return response.data;
};

/**
 * Helper functions for specific modalities
 */

export const generateText2Text = async (
    provider: string,
    model: string,
    prompt: string,
    options?: {
        system_prompt?: string;
        temperature?: number;
        max_tokens?: number;
    }
): Promise<string> => {
    const response = await generateAI({
        modality: "text2text",
        provider,
        model,
        prompt,
        ...options,
    });
    return response.text || "";
};

export const generateText2Image = async (
    provider: string,
    model: string,
    prompt: string,
    options?: {
        size?: string;
        quality?: string;
        style?: string;
        n?: number;
    }
): Promise<string> => {
    const response = await generateAI({
        modality: "text2image",
        provider,
        model,
        prompt,
        ...options,
    });
    return response.image_url || "";
};

export const generateTextImage2Text = async (
    provider: string,
    model: string,
    prompt: string,
    images: { urls?: string[]; base64s?: string[] },
    options?: {
        system_prompt?: string;
        temperature?: number;
        max_tokens?: number;
    }
): Promise<string> => {
    const response = await generateAI({
        modality: "textimage2text",
        provider,
        model,
        prompt,
        image_urls: images.urls,
        image_base64s: images.base64s,
        ...options,
    });
    return response.text || "";
};

export const generateTextImage2Image = async (
    provider: string,
    model: string,
    prompt: string,
    image: { url?: string; base64?: string },
    options?: {
        mask_url?: string;
        mask_base64?: string;
        size?: string;
        quality?: string;
        style?: string;
        n?: number;
    }
): Promise<string> => {
    const response = await generateAI({
        modality: "textimage2image",
        provider,
        model,
        prompt,
        image_urls: image.url ? [image.url] : undefined,
        image_base64s: image.base64 ? [image.base64] : undefined,
        ...options,
    });
    return response.image_url || "";
};