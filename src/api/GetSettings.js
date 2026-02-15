import axios from 'axios';
import {refreshToken} from "./GetToken";

export const getSettings = async (navigate) => {
    const askUrl = process.env.REACT_APP_API_URL + "/settings";

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