import axios from 'axios';
import { refreshToken } from './GetToken';
import { getApiBaseUrl } from '../config';
import { updateFileStatus } from './UpdateFileStatus';

export const getUploadUrl = async (file, navigate) => {
    const url = getApiBaseUrl() + '/files/upload-link';
    const accessToken = localStorage.getItem('access_token');
    const response = await axios.post(url, { filename: file.name }, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return response.data; // { upload_url, s3_key, file_id, expires_in }
};

export const uploadToS3 = (file, uploadUrl, onProgress) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                const body = xhr.responseText || '';
                const code = (body.match(/<Code>([^<]+)<\/Code>/) || [])[1] || '';
                const msg  = (body.match(/<Message>([^<]+)<\/Message>/) || [])[1] || body.slice(0, 200);
                reject(new Error(`Ошибка загрузки ${xhr.status}: ${code || xhr.statusText}. ${msg}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Ошибка сети при загрузке')));
        xhr.addEventListener('abort', () => reject(new Error('Загрузка отменена')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'application/pdf');
        xhr.send(file);
    });
};

/**
 * Returns file_id after successful upload so the caller can track WS updates.
 */
export const uploadFile = async (file, navigate, onProgress) => {
    const doUpload = async () => {
        const data = await getUploadUrl(file, navigate);
        const { upload_url: uploadUrl, file_id: fileId } = data;
        if (!uploadUrl) throw new Error('Бэкенд не вернул URL загрузки');

        await updateFileStatus(fileId, 'uploading');
        try {
            await uploadToS3(file, uploadUrl, onProgress);
        } catch (err) {
            await updateFileStatus(fileId, 'failed', err.message);
            throw err;
        }
        await updateFileStatus(fileId, 'uploaded');
        return fileId;
    };

    try {
        return await doUpload();
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await uploadFile(file, navigate, onProgress);
            navigate('/login');
            return null;
        }
        if (error.response?.data) {
            throw new Error(error.response.data.detail || error.response.data.message || 'Ошибка получения URL загрузки');
        }
        throw error;
    }
};
