import axios from 'axios';
import {refreshToken} from "./GetToken";

export const checkIndexRunning = async (navigate) => {
    const askUrl = process.env.REACT_APP_API_URL + "/indexes/status";

    const accessToken = localStorage.getItem("access_token");
    try {
        const response = await axios.get(askUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        localStorage.setItem("index_loading", response.data.status === "still running");
        return true;
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await checkIndexRunning(navigate);
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