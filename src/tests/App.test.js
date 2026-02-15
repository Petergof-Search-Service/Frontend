import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

const setLocation = (path) => {
  window.history.replaceState({}, '', path);
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('редирект на /login при неавторизованном пользователе', () => {
    setLocation('/');
    render(<App />);
    expect(screen.getByRole('heading', { name: /Авторизация/i })).toBeInTheDocument();
  });

  it('редирект на /chat при авторизованном пользователе', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
    setLocation('/');
    render(<App />);
    expect(screen.getByRole('link', { name: /Чат/i })).toBeInTheDocument();
  });

  it('страница логина отображается по /login', () => {
    setLocation('/login');
    render(<App />);
    expect(screen.getByRole('button', { name: /Войти/i })).toBeInTheDocument();
  });

  it('страница регистрации отображается по /register', () => {
    setLocation('/register');
    render(<App />);
    expect(screen.getByRole('button', { name: /Зарегистрироваться/i })).toBeInTheDocument();
  });
});
