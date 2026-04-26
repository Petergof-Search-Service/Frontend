import axios from 'axios';
import { refreshToken, getAuthHeaders } from './GetToken';
import { getApiBaseUrl } from '../config';

const orgUrl = (path = '') => {
    const orgId = localStorage.getItem('org_id');
    return `${getApiBaseUrl()}/organizations/${orgId}${path}`;
};

export const getOrgMembers = async (navigate) => {
    try {
        const response = await axios.get(orgUrl('/members'), { headers: getAuthHeaders() });
        return response.data.members;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await getOrgMembers(navigate);
            navigate('/login');
        }
        return null;
    }
};

export const addOrgMember = async (email, role, navigate) => {
    try {
        await axios.post(orgUrl('/members'), { email, role }, { headers: getAuthHeaders() });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await addOrgMember(email, role, navigate);
            navigate('/login');
        }
        const detail = error.response?.data?.detail;
        throw new Error(detail || 'Ошибка добавления пользователя');
    }
};

export const updateMemberRole = async (userId, role, navigate) => {
    try {
        await axios.patch(orgUrl(`/members/${userId}`), { role }, { headers: getAuthHeaders() });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await updateMemberRole(userId, role, navigate);
            navigate('/login');
        }
        const detail = error.response?.data?.detail;
        throw new Error(detail || 'Ошибка изменения роли');
    }
};

export const removeOrgMember = async (userId, navigate) => {
    try {
        await axios.delete(orgUrl(`/members/${userId}`), { headers: getAuthHeaders() });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await removeOrgMember(userId, navigate);
            navigate('/login');
        }
        const detail = error.response?.data?.detail;
        throw new Error(detail || 'Ошибка удаления пользователя');
    }
};
