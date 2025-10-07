import axios from "axios";
import { UserSettings } from "../types/usersettings";

export const getUserSettings = async (id: string) => {
    const response = await axios.get(`/api/v1/users/${id}/settings`,
        {
            withCredentials: true
        });
    return response.data as UserSettings;
};

export const updateOpenAIKey = async (userSettings: UserSettings) => {
    const response = await axios.patch(`/api/v1/users/${userSettings.user_id}/settings/openaikey`, userSettings);
    return response.data as UserSettings;
};

export const updateGeminiKey = async (userSettings: UserSettings) => {
    const response = await axios.patch(`/api/v1/users/${userSettings.user_id}/settings/geminikey`, userSettings);
    return response.data as UserSettings;
};