import axios from 'axios';
import qs from 'qs';
import { getApiBaseUrl } from '../config';

export const setUser = async (email, password) => {
    const tokenUrl = getApiBaseUrl() + "/token";

    console.log(tokenUrl);

    const data = qs.stringify({
        grant_type: 'password',
        username: email,
        password: password,
    });
    const response = await axios.post(tokenUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
};

export const registerUser = async (email, password) => {
    const registerUrl = getApiBaseUrl() + "/register";

    const response = await axios.post(registerUrl, {
        'email': email,
        'password': password
    }, {
        headers: {
            'Content-Type': 'application/json'
        },
    });

    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
};