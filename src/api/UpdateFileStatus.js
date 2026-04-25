import axios from 'axios';
import { getApiBaseUrl } from '../config';

export const updateFileStatus = async (fileId, status, errorMessage = null) => {
    const url = `${getApiBaseUrl()}/files/${fileId}/status`;
    const accessToken = localStorage.getItem('access_token');
    try {
        await axios.patch(url, { status, error_message: errorMessage }, {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.warn('updateFileStatus failed:', e?.response?.data || e.message);
    }
};
