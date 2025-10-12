import axios from "axios";
import { AIModel, AIGenerateRequest, AIGenerateResponse } from "../types/ai";

/**
 * Unified AI API - Single endpoint for all AI modalities
 */

export const listAIModels = async (): Promise<AIModel[]> => {
    const response = await axios.get(`/api/v1/tools/ai/models`, { withCredentials: true });
    return response.data;
};

export const generateContent = async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
    const response = await axios.post(`/api/v1/tools/ai/generate`, request, { withCredentials: true });
    return response.data;
};
