import axios from 'axios';
import { refreshToken, getAuthHeaders } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const checkIndexRunning = async (navigate) => {
    const askUrl = getApiBaseUrl() + "/indexes/status";

    try {
        const response = await axios.get(askUrl, {
            headers: getAuthHeaders(),
        });

        localStorage.setItem("index_loading", response.data.status === "still running");
        return true;
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await checkIndexRunning(navigate);
            } else {
                navigate("/login");
            }
        } else if (error.response.status === 403) {
            navigate("/chat");
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};