/**
 * Базовый URL API. При деплое без REACT_APP_API_URL подставляется по hostname:
 * - localhost/127.0.0.1 → http://localhost:8000/api/v1
 * - test.* → https://test.petergof-sciense-rag.ru/api/v1
 * - иначе → https://petergof-sciense-rag.ru/api/v1
 */
export const getApiBaseUrl = () => {
    const env = process.env.REACT_APP_API_URL;
    if (env) return env;
    if (typeof window !== 'undefined') {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:8000/api/v1';
        if (h.includes('test.')) return 'https://test.petergof-sciense-rag.ru/api/v1';
    }
    return 'https://petergof-sciense-rag.ru/api/v1';
};
