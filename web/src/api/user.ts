import axios from "axios";
import { User, GenCommand } from "../types/user";

export type { User, GenCommand } from "../types/user";

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
