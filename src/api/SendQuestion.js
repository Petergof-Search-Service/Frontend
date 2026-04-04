import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const askQuestion = async (index, user_question, navigate) => {
    const base = getApiBaseUrl();
    const askUrl = base + "/answer";

    const accessToken = localStorage.getItem("access_token");

    try {
        const response = await axios.post(askUrl, {
            'index': index,
            'question': user_question
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) {
                return await askQuestion(index, user_question, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('Ошибка API:', error.response?.data || error.message);
        }
    }
};