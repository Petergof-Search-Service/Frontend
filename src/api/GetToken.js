import axios from 'axios';
import { getApiBaseUrl } from '../config';

let refreshPromise = null;

const clearTokensAndRedirect = (navigate) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('org_id');
    localStorage.removeItem('org_role');
    localStorage.removeItem('org_name');
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

export const refreshUserOrg = async (navigate) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;
    try {
        const response = await axios.get(getApiBaseUrl() + '/organizations', {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });
        const orgs = response.data.organizations;
        if (!orgs || orgs.length === 0) return;
        const currentOrgId = localStorage.getItem('org_id');
        const org = orgs.find(o => String(o.id) === currentOrgId) || orgs[0];
        localStorage.setItem('org_id', String(org.id));
        localStorage.setItem('org_role', org.role);
        localStorage.setItem('org_name', org.name);
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await refreshUserOrg(navigate);
            clearTokensAndRedirect(navigate);
        }
    }
};
