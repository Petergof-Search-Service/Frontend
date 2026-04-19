import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const createChat = async (navigate) => {
    const url = getApiBaseUrl() + "/chats";
    const accessToken = localStorage.getItem("access_token");

    try {
        const response = await axios.post(url, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await createChat(navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка создания чата:', error.response?.data || error.message);
        }
        return null;
    }
};
