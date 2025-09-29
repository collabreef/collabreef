import axios from "axios";

export interface TextGenModel {
    id: string
    provider: string
    name: string
}

export const listModels = async () => {
    const response = await axios.get(`/api/v1/tools/textgen/models`, { withCredentials: true });
    return response.data
};

export const textGen = async (prompt: string, model: TextGenModel) => {
    const response = await axios.post(`/api/v1/tools/textgen/generate`, {
        provider: model.provider,
        model: model.name,
        prompt
    });
    return response.data
};

