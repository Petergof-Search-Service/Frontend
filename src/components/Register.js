import React, {useState} from 'react';
import {registerUser} from "../api/Authorization";
import {useNavigate, Link} from "react-router-dom";
import {Button, Form, Container, Alert, Card, Spinner} from 'react-bootstrap';

const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [repeatPasswordError, setRepeatPasswordError] = useState('');
    const navigate = useNavigate();

    const validateForm = () => {
        let isValid = true;
        setEmailError('');
        setPasswordError('');
        setRepeatPasswordError('');

        if (!email.trim()) {
            setEmailError('Email обязателен для заполнения');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Введите корректный email');
            isValid = false;
        }

        if (!password) {
            setPasswordError('Пароль обязателен для заполнения');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Пароль должен содержать минимум 6 символов');
            isValid = false;
        }

        if (!repeatPassword) {
            setRepeatPasswordError('Повторите пароль');
            isValid = false;
        } else if (password !== repeatPassword) {
            setRepeatPasswordError('Пароли не совпадают');
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await registerUser(email, password);
            navigate("/chat");
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.detail === "User already registered") {
                setError('Пользователь с такой почтой уже зарегистрирован');
            } else {
                setError('Ошибка подключения. Проверьте интернет-соединение и попробуйте позже.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh', padding: '2rem'}}>
            <Card className="shadow-lg" style={{width: '100%', maxWidth: '450px'}}>
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-primary mb-2">Регистрация</h2>
                        <p className="text-muted">Создайте новый аккаунт</p>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formEmail" className="mb-3">
                            <Form.Label className="fw-semibold">Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Введите email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setEmailError('');
                                }}
                                isInvalid={!!emailError}
                                disabled={loading}
                            />
                            <Form.Control.Feedback type="invalid">
                                {emailError}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group controlId="formPassword" className="mb-3">
                            <Form.Label className="fw-semibold">Пароль</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Введите пароль"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError('');
                                }}
                                isInvalid={!!passwordError}
                                disabled={loading}
                            />
                            <Form.Control.Feedback type="invalid">
                                {passwordError}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group controlId="formPasswordRepeat" className="mb-3">
                            <Form.Label className="fw-semibold">Повторите пароль</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Введите пароль повторно"
                                value={repeatPassword}
                                onChange={(e) => {
                                    setRepeatPassword(e.target.value);
                                    setRepeatPasswordError('');
                                }}
                                isInvalid={!!repeatPasswordError}
                                disabled={loading}
                            />
                            <Form.Control.Feedback type="invalid">
                                {repeatPasswordError}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100 mb-3"
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Регистрация...
                                </>
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </Button>

                        <div className="text-center">
                            <span className="text-muted">Уже есть аккаунт? </span>
                            <Link to="/login" className="text-decoration-none fw-semibold">
                                Войдите
                            </Link>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RegisterForm;