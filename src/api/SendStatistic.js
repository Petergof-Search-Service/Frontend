import axios from 'axios';
import { refreshToken } from "./GetToken";
import { getApiBaseUrl } from '../config';

export const sendStatistic = async (user_question, model_answer, is_ok, correct_answer, navigate) => {
    const askUrl = getApiBaseUrl() + "/review";

    const accessToken = localStorage.getItem("access_token");
    try {
        await axios.post(askUrl, {
            'question': user_question,
            'model_answer': model_answer,
            'is_ok': is_ok,
            'correct_answer': correct_answer
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        if (error.response.status === 401) {
            if (await refreshToken(navigate)) {
                return await sendStatistic(user_question, model_answer, is_ok, correct_answer, navigate);
            } else {
                navigate("/login");
            }
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
    }
};