import axios from 'axios';
import { getAuthHeaders, refreshToken } from './GetToken';
import { getApiBaseUrl } from '../config';

const RETRY_DELAYS_MS = [400, 1000, 2500];

/**
 * Надёжно обновляет статус файла на бэкенде.
 *
 * Раньше функция была fire-and-forget: при любой ошибке молча писала console.warn.
 * Из-за этого протухший в середине батча токен (401) или сетевой хиккап ронял
 * PATCH, и статус молча оставался `pending_upload` — хотя файл уже был залит в S3
 * (PUT — отдельный запрос) и OCR его подхватывал. На UI это выглядело как «Ожидание»
 * у уже обрабатываемого файла.
 *
 * Теперь:
 *  - при 401 рефрешим токен и повторяем;
 *  - при сетевых/временных ошибках — несколько повторов с backoff.
 *
 * Возвращает true, если бэкенд принял статус, иначе false. Не бросает — загрузка
 * не должна падать из-за обновления статуса.
 */
export const updateFileStatus = async (fileId, status, errorMessage = null, navigate = null) => {
    const url = `${getApiBaseUrl()}/files/${fileId}/status`;
    const body = { status, error_message: errorMessage };

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
            await axios.patch(url, body, { headers: getAuthHeaders() });
            return true;
        } catch (e) {
            const code = e?.response?.status;
            if (code === 401) {
                const refreshed = await refreshToken(navigate);
                if (refreshed) continue; // повтор с новым токеном
                return false; // refresh не удался — токены сброшены
            }
            if (attempt < RETRY_DELAYS_MS.length) {
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
                continue;
            }
            console.warn('updateFileStatus failed:', e?.response?.data || e.message);
            return false;
        }
    }
    return false;
};
