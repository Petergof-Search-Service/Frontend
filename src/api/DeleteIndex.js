import axios from 'axios';
import { refreshToken, getAuthHeaders } from './GetToken';
import { getApiBaseUrl } from '../config';

// Удаление индекса. Бэкенд запрещает удалять индекс в статусе building (409),
// поэтому UI отключает кнопку для строящихся индексов.
export const deleteIndex = async (indexId, navigate) => {
    const url = getApiBaseUrl() + `/indexes/${indexId}`;
    try {
        await axios.delete(url, {
            headers: getAuthHeaders(),
        });
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await deleteIndex(indexId, navigate);
            navigate('/login');
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
        return false;
    }
};
