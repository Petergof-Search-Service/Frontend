import axios from 'axios';

export const refreshToken = async (navigate) => {

    const refreshUrl = process.env.REACT_APP_API_URL + "/refresh";

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
        navigate("/login");
    }
    try {
        const response = await axios.post(refreshUrl, {}, {
            headers: {
                'refresh-token': refreshToken
            }
        });

        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        return true;
    } catch (error) {
        navigate("/login");
        return false;
    }
};