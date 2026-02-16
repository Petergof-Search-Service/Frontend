import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const getSettings = async (navigate) => {
    const askUrl = getApiBaseUrl() + "/settings";

    const accessToken = localStorage.getItem("access_token");
    try {
        const response = await axios.get(askUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await getSettings(navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};