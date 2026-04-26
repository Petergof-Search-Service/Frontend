import axios from 'axios';
import { refreshToken, getAuthHeaders } from './GetToken';
import { getApiBaseUrl } from '../config';

export const getUploadedFiles = async (navigate) => {
    const url = getApiBaseUrl() + '/files';
    try {
        const response = await axios.get(url, {
            headers: getAuthHeaders(),
        });
        return response.data.files;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await getUploadedFiles(navigate);
            navigate('/login');
        }
        return [];
    }
};
