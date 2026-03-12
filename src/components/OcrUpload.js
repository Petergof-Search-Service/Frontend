import React, {useEffect, useState} from "react";
import {Form, Button, Spinner, Alert, Container, Card, ProgressBar} from "react-bootstrap";
import Navbar from "./Navbar";
import {isAdmin} from "../api/IsAdmin";
import {useNavigate} from "react-router-dom";
import {checkFileRunning} from "../api/CheckFileRunning";
import {uploadFile} from "../api/UploadFile";

const OcrUpload = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
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

    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB (лимит single-part PUT в S3)

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/pdf") {
                setError("Пожалуйста, выберите PDF файл");
                setFile(null);
                return;
            }
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError(`Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024 / 1024} ГБ`);
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
        setUploadProgress(0);
        localStorage.setItem('file_loading', "true");
        setError(null);
        setSuccess(false);

        try {
            await uploadFile(file, navigate, (percent) => setUploadProgress(percent));
            setSuccess(true);
            setFile(null);
            // Сброс input file
            event.target.reset();
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            setError(err.message || "Ошибка загрузки файла. Попробуйте позже.");
        } finally {
            setLoading(false);
            setUploadProgress(null);
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
                                    Максимальный размер файла: 5 ГБ. Поддерживаются только PDF файлы.
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
                                {loading && uploadProgress !== null && (
                                    <div className="mt-3">
                                        <ProgressBar
                                            now={uploadProgress}
                                            label={`${uploadProgress}%`}
                                            variant="primary"
                                            striped
                                            animated
                                        />
                                        <small className="text-muted">
                                            {uploadProgress < 100 ? 'Загрузка в облако...' : 'Ожидание обработки...'}
                                        </small>
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
