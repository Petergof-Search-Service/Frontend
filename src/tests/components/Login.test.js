import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import LoginForm from '../../components/Login';

jest.mock('../../api/Authorization', () => ({
  setUser: jest.fn(),
}));

const { setUser } = require('../../api/Authorization');

const renderLogin = () => {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('отображает форму авторизации', () => {
    renderLogin();
    expect(screen.getByText(/Авторизация/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Введите email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Введите пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Войти/i })).toBeInTheDocument();
  });

  it('показывает ошибку при пустом email', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));
    expect(await screen.findByText(/Email обязателен для заполнения/i)).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
  });

  it('показывает ошибку при некорректном email', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/Введите email/i), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByPlaceholderText(/Введите пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));
    expect(await screen.findByText(/Введите корректный email/i)).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
  });

  it('показывает ошибку при коротком пароле', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/Введите email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Введите пароль/i), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));
    expect(await screen.findByText(/Пароль должен содержать минимум 6 символов/i)).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
  });

  it('вызывает setUser при валидной форме', async () => {
    setUser.mockResolvedValue(undefined);
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/Введите email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Введите пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));
    expect(setUser).toHaveBeenCalledWith('user@test.com', 'password123');
  });
});
