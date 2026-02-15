import axios from 'axios';
import {refreshToken} from "./GetToken";

export const askQuestion = async (index, user_question, navigate) => {
    const askUrl = process.env.REACT_APP_API_URL + "/answer";
    const statusUrl = process.env.REACT_APP_API_URL + "/answer/status/";

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

        const taskId = response.data.task_id;

        while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const statusResponse = await axios.get(`${statusUrl}${taskId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (statusResponse.status === 200) {
                    return statusResponse.data.status;
                }
            } catch (statusError) {
                if (statusError.response?.status !== 404) {
                    break;
                }
            }
        }
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