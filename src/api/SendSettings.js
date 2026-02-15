import axios from 'axios';
import {refreshToken} from "./GetToken";
import {sendStatistic} from "./SendStatistic";

export const sendSettings = async (settings, navigate) => {
    const askUrl = process.env.REACT_APP_API_URL + "/settings";

    const accessToken = localStorage.getItem("access_token");
    try {
        await axios.post(askUrl, settings, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await sendStatistic(settings, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};