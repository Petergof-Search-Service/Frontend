import axios from 'axios';
import { refreshToken, getAuthHeaders } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const askQuestion = async (indexId, user_question, chatId, navigate) => {
    const base = getApiBaseUrl();
    const askUrl = base + "/answer";

    try {
        const response = await axios.post(askUrl, {
            'index_id': indexId,
            'question': user_question,
            'chat_id': chatId
        }, {
            headers: getAuthHeaders(),
        });

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await askQuestion(indexId, user_question, chatId, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка API:', error.response?.data || error.message);
        }
    }
};