import axios from "axios";
import { User, GenCommand } from "../types/user";
import { UserSettings } from "../types/usersettings";


export const updatePreferences = async (user: User) => {
    const response = await axios.patch(`/api/v1/users/${user.id}/preferences`,
        {
            preferences: user.preferences
        });
    return response.data as User;
};

// Gen Commands CRUD
export const getUserGenCommands = async (userId: string) => {
    const response = await axios.get(`/api/v1/users/${userId}/gencommands`);
    return response.data as GenCommand[];
};

export const createUserGenCommand = async (userId: string, command: Omit<GenCommand, 'id'>) => {
    const response = await axios.post(`/api/v1/users/${userId}/gencommands`, command);
    return response.data as GenCommand;
};

export const updateUserGenCommand = async (userId: string, commandId: string, command: Omit<GenCommand, 'id'>) => {
    const response = await axios.put(`/api/v1/users/${userId}/gencommands/${commandId}`, command);
    return response.data as GenCommand;
};

export const deleteUserGenCommand = async (userId: string, commandId: string) => {
    await axios.delete(`/api/v1/users/${userId}/gencommands/${commandId}`);
};
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