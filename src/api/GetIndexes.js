import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const getIndexes = async (navigate) => {
    const askUrl = getApiBaseUrl() + "/indexes";

    const accessToken = localStorage.getItem("access_token");
    try {
        const response = await axios.get(askUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.indexes;
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await getIndexes(navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};