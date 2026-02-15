import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import App from './App';
import {createRoot} from "react-dom/client";
import './index.css';

// Устанавливаем тему при загрузке
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

const domNode = document.getElementById('root');
const root = createRoot(domNode);
root.render(<App/>);
