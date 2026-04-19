import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const getChats = async (navigate) => {
    const url = getApiBaseUrl() + "/chats";
    const accessToken = localStorage.getItem("access_token");

    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return response.data.chats;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await getChats(navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка загрузки чатов:', error.response?.data || error.message);
        }
        return null;
    }
};
