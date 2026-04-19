import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const deleteChat = async (chatId, navigate) => {
    const url = getApiBaseUrl() + `/chats/${chatId}`;
    const accessToken = localStorage.getItem("access_token");

    try {
        await axios.delete(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await deleteChat(chatId, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка удаления чата:', error.response?.data || error.message);
        }
        return false;
    }
};
