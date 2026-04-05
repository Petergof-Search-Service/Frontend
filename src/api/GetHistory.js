import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const getHistory = async (navigate) => {
    const url = getApiBaseUrl() + "/history";
    const accessToken = localStorage.getItem("access_token");

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });
        return response.data.messages;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await getHistory(navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка загрузки истории:', error.response?.data || error.message);
        }
        return null;
    }
};
