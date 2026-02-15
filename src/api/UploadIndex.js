import axios from 'axios';
import {refreshToken} from "./GetToken";

export const uploadIndexApi = async (file_names, name, navigate) => {
    const uploadURL = process.env.REACT_APP_API_URL + "/indexes";
    const statusUrl = process.env.REACT_APP_API_URL + "/indexes/status";

    const accessToken = localStorage.getItem("access_token");

    try {
        await axios.post(uploadURL, {
            'name': name,
            'file_names': file_names
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
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
                return await uploadIndexApi(file_names, name, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка API:', error.response?.data || error.message);
        }
    }
};