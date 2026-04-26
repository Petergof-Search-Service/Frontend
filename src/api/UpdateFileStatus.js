import axios from 'axios';
import { getAuthHeaders } from './GetToken';
import { getApiBaseUrl } from '../config';

export const updateFileStatus = async (fileId, status, errorMessage = null) => {
    const url = `${getApiBaseUrl()}/files/${fileId}/status`;
    try {
        await axios.patch(url, { status, error_message: errorMessage }, {
            headers: getAuthHeaders(),
        });
    } catch (e) {
        console.warn('updateFileStatus failed:', e?.response?.data || e.message);
    }
};
