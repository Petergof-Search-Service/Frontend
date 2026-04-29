import axios from 'axios';
import { refreshToken, getAuthHeaders } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const uploadIndexApi = async (file_ids, name, navigate) => {
    const base = getApiBaseUrl();
    const uploadURL = base + "/indexes";

    try {
        await axios.post(uploadURL, { name, file_ids }, {
            headers: getAuthHeaders(),
        });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await uploadIndexApi(file_ids, name, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка API:', error.response?.data || error.message);
            throw error;
        }
    }
};
