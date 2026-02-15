import React, {useState} from 'react';
import {setUser} from "../api/Authorization";
import {useNavigate, Link} from "react-router-dom";
import {Button, Form, Container, Alert, Card, Spinner} from 'react-bootstrap';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();

    const validateForm = () => {
        let isValid = true;
        setEmailError('');
        setPasswordError('');

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
            await setUser(email, password);
            navigate("/chat");
        } catch (error) {
            if (error.response?.status === 401) {
                if (error.response.data.detail === "Incorrect email") {
                    setError('Неверная почта. Попробуйте снова.');
                } else {
                    setError('Неверный пароль. Попробуйте снова.');
                }
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
                        <h2 className="fw-bold text-primary mb-2">Авторизация</h2>
                        <p className="text-muted">Войдите в свой аккаунт</p>
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
                                    Вход...
                                </>
                            ) : (
                                'Войти'
                            )}
                        </Button>

                        <div className="text-center">
                            <span className="text-muted">Нет аккаунта? </span>
                            <Link to="/register" className="text-decoration-none fw-semibold">
                                Зарегистрируйтесь
                            </Link>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginForm;