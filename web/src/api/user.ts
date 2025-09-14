import axios from "axios";
import { User } from "../stores/current-user";

export const updatePreferences = async (user: User) => {
    const response = await axios.patch(`/api/v1/users/${user.id}/preferences`,
        { 
            preferences: user.preferences
        });
    return response.data as User;
};
