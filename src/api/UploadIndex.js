import axios from 'axios';
import { refreshToken, getAuthHeaders } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const uploadIndexApi = async (file_ids, name, navigate) => {
    const base = getApiBaseUrl();
    const uploadURL = base + "/indexes";
    const statusUrl = base + "/indexes/status";

    try {
        await axios.post(uploadURL, {
            'name': name,
            'file_ids': file_ids
        }, {
            headers: getAuthHeaders(),
        });

        while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const statusResponse = await axios.get(statusUrl, {
                    headers: getAuthHeaders(),
                });

                if (statusResponse.status === 200 && statusResponse.data.status === "not running") {
                    return true;
                }
            } catch (statusError) {
                break
            }
        }
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await uploadIndexApi(file_ids, name, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка API:', error.response?.data || error.message);
        }
    }
};
