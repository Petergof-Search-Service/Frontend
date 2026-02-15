import React, {useEffect, useState} from "react";
import {Form, Button, Spinner, Alert, Container, Card} from "react-bootstrap";
import Navbar from "./Navbar";
import {isAdmin} from "../api/IsAdmin";
import {useNavigate} from "react-router-dom";
import {checkFileRunning} from "../api/CheckFileRunning";
import {uploadOcr} from "../api/UploadOcr";

const OcrUpload = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllow = async () => {
            try {
                const is_admin = await isAdmin(navigate);
                setIsAdminUser(is_admin);
                if (!is_admin) {
                    navigate("/chat");
                    return;
                }
                await checkFileRunning();
                setLoading(localStorage.getItem("file_loading") === "true");
            } catch (error) {
                setError("Ошибка проверки прав доступа");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchAllow();
    }, [navigate]);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/pdf") {
                setError("Пожалуйста, выберите PDF файл");
                setFile(null);
                return;
            }
            if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
                setError("Размер файла не должен превышать 50 МБ");
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError("Пожалуйста, выберите файл");
            return;
        }

        setLoading(true);
        localStorage.setItem('file_loading', "true");
        setError(null);
        setSuccess(false);

        try {
            await uploadOcr(file, navigate);
            setSuccess(true);
            setFile(null);
            // Сброс input file
            event.target.reset();
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (error) {
            setError("Ошибка загрузки файла. Попробуйте позже.");
        } finally {
            setLoading(false);
            localStorage.setItem('file_loading', "false");
        }
    };

    if (initialLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column vh-100 bg-light">
            <Navbar isAdmin={isAdminUser} />
            <Container className="flex-grow-1 py-4">
                <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">Загрузка файла</h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                                Файл успешно загружен! Обработка может занять некоторое время.
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group controlId="formFile" className="mb-4">
                                <Form.Label className="fw-semibold">Выберите PDF файл</Form.Label>
                                <Form.Control 
                                    type="file" 
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Максимальный размер файла: 50 МБ. Поддерживаются только PDF файлы.
                                </Form.Text>
                                {file && (
                                    <div className="mt-2">
                                        <Alert variant="info" className="mb-0">
                                            <strong>Выбранный файл:</strong> {file.name} 
                                            <br />
                                            <small>Размер: {(file.size / 1024 / 1024).toFixed(2)} МБ</small>
                                        </Alert>
                                    </div>
                                )}
                            </Form.Group>
                            <Button 
                                type="submit" 
                                variant="primary" 
                                disabled={loading || !file}
                                size="lg"
                                className="w-100"
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Загрузка...
                                    </>
                                ) : (
                                    "Загрузить файл"
                                )}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default OcrUpload;
