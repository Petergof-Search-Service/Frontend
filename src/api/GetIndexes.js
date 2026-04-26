import axios from 'axios';
import { refreshToken, getAuthHeaders } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const getIndexes = async (navigate) => {
    const askUrl = getApiBaseUrl() + "/indexes";

    try {
        const response = await axios.get(askUrl, {
            headers: getAuthHeaders(),
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