import axios from 'axios';
import { getApiBaseUrl } from '../config';

let refreshPromise = null;

const clearTokensAndRedirect = (navigate) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('org_id');
    localStorage.removeItem('org_role');
    if (typeof navigate === 'function') {
        navigate("/login");
    }
};

export const getAuthHeaders = () => {
    const accessToken = localStorage.getItem('access_token');
    const orgId = localStorage.getItem('org_id');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    if (orgId) headers['X-Organization-ID'] = Number(orgId);
    return headers;
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

    const refreshUrl = getApiBaseUrl() + "/refresh";
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
