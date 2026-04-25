import axios from 'axios';
import { refreshToken } from './GetToken';
import { getApiBaseUrl } from '../config';

export const getUploadedFiles = async (navigate) => {
    const url = getApiBaseUrl() + '/files';
    const accessToken = localStorage.getItem('access_token');
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
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
