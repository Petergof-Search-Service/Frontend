import axios from 'axios';
import { refreshToken } from './GetToken';
import { getApiBaseUrl } from '../config';

export const deleteFile = async (fileId, navigate) => {
    const url = getApiBaseUrl() + `/files/${fileId}`;
    const accessToken = localStorage.getItem('access_token');
    try {
        await axios.delete(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await deleteFile(fileId, navigate);
            navigate('/login');
        }
        return false;
    }
};
