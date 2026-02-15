import axios from 'axios';
import {refreshToken} from "./GetToken";

export const checkFileRunning = async (navigate) => {
    const askUrl = process.env.REACT_APP_API_URL + "/files/status";

    const accessToken = localStorage.getItem("access_token");
    try {
        const response = await axios.get(askUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        localStorage.setItem("file_loading", response.data.is_running.toString());
        return true;
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await checkFileRunning(navigate);
            } else {
                navigate("/login");
            }
        } else if (error.response.status === 403) {
            navigate("/chat");
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};