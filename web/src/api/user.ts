import axios from "axios";
import { User } from "../types/user";

export const updatePreferences = async (user: User) => {
    const response = await axios.patch(`/api/v1/users/${user.id}/preferences`,
        {
            preferences: user.preferences
        });
    return response.data as User;
};

export const updateGenCommands = async (user: User) => {
    const response = await axios.patch(`/api/v1/users/${user.id}/gencommands`,
        {
            gencommnads: user.gen_commands
        });
    return response.data as User;
};
