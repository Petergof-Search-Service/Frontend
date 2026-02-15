import axios from 'axios';
import {refreshToken} from "./GetToken";

export const uploadOcr = async (file, navigate) => {
    const uploadURL = process.env.REACT_APP_API_URL + "/files";
    const statusUrl = process.env.REACT_APP_API_URL + "/files/status";

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