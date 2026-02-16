import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const uploadOcr = async (file, navigate) => {
    const base = getApiBaseUrl();
    const uploadURL = base + "/files";
    const statusUrl = base + "/files/status";

    const formData = new FormData();
    formData.append("file", file);

    const accessToken = localStorage.getItem("access_token");

    try {
        await axios.post(uploadURL, formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const statusResponse = await axios.get(statusUrl, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (statusResponse.status === 200 && statusResponse.data.is_running === false) {
                    return true;
                }
            } catch (statusError) {
                break
            }
        }
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await uploadOcr(file, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка API:', error.response?.data || error.message);
        }
    }
};