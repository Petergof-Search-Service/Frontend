import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

/**
 * Запрашивает у бэкенда presigned URL для загрузки файла в S3.
 * Ответ: { upload_url, s3_key, expires_in }
 */
export const getUploadUrl = async (file, navigate) => {
    const base = getApiBaseUrl();
    const url = base + "/files/upload-link";
    const accessToken = localStorage.getItem("access_token");

    const response = await axios.post(url, {
        filename: file.name,
    }, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    return response.data;
};

/**
 * Загружает файл в S3 по presigned URL через PUT.
 * onProgress(percent) вызывается с 0..100.
 */
export const uploadToS3 = (file, uploadUrl, onProgress) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                const body = xhr.responseText || '';
                console.error('S3/Yandex storage error response:', xhr.status, body);
                const codeMatch = body.match(/<Code>([^<]+)<\/Code>/);
                const msgMatch = body.match(/<Message>([^<]+)<\/Message>/);
                const code = codeMatch ? codeMatch[1] : '';
                const msg = msgMatch ? msgMatch[1] : body.slice(0, 200);
                reject(new Error(`Ошибка загрузки ${xhr.status}: ${code || xhr.statusText}. ${msg}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Ошибка сети при загрузке')));
        xhr.addEventListener('abort', () => reject(new Error('Загрузка отменена')));

        xhr.open('PUT', uploadUrl);
        // Должен совпадать с ContentType при генерации presigned URL на бэкенде, иначе 403.
        xhr.setRequestHeader('Content-Type', 'application/pdf');
        xhr.send(file);
    });
};

/**
 * Запрос presigned URL → загрузка файла в S3 с прогрессом. Опрос статуса не выполняется.
 * onProgress(percent) — опционально, 0..100 во время загрузки.
 */
export const uploadFile = async (file, navigate, onProgress) => {
    const doUpload = async () => {
        const data = await getUploadUrl(file, navigate);
        const uploadUrl = data.upload_url;
        if (!uploadUrl) throw new Error('Бэкенд не вернул URL загрузки');
        await uploadToS3(file, uploadUrl, onProgress);
    };

    try {
        await doUpload();
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await uploadFile(file, navigate, onProgress);
            }
            navigate("/login");
            return;
        }
        if (error.response?.data) {
            throw new Error(error.response.data.detail || error.response.data.message || 'Ошибка получения URL загрузки');
        }
        throw error;
    }
};
