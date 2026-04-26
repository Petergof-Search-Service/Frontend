import axios from 'axios';
import { refreshToken, getAuthHeaders } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const getFiles = async (navigate) => {
    const askUrl = getApiBaseUrl() + "/rag-files";

    try {
        const response = await axios.get(askUrl, {
            headers: getAuthHeaders(),
        });

        return response.data.files;
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await getFiles(navigate);
            } else {
                navigate("/login");
            }

        } else if (error.response.status === 403) {
            console.log("not admin");
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};