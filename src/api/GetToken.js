import axios from 'axios';

let refreshPromise = null;

const clearTokensAndRedirect = (navigate) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (typeof navigate === 'function') {
        navigate("/login");
    }
    window.location.replace("/login");
};

export const refreshToken = async (navigate) => {
    const stored = localStorage.getItem("refresh_token");
    if (!stored) {
        clearTokensAndRedirect(navigate);
        return false;
    }

    if (refreshPromise) {
        return await refreshPromise;
    }

    const refreshUrl = process.env.REACT_APP_API_URL + "/refresh";
    refreshPromise = (async () => {
        try {
            const response = await axios.post(refreshUrl, {}, {
                headers: { 'refresh-token': stored }
            });
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            return true;
        } catch (error) {
            clearTokensAndRedirect(navigate);
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return await refreshPromise;
};
