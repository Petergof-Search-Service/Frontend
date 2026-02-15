import React, {useEffect, useState} from "react";
import {Button, Form, ListGroup, Container, Spinner, Card, Alert, Badge} from "react-bootstrap";
import {getFiles} from "../api/GetFiles";
import {useNavigate} from "react-router-dom";
import Navbar from "./Navbar";
import {isAdmin} from "../api/IsAdmin";
import {uploadIndexApi} from "../api/UploadIndex";
import {checkIndexRunning} from "../api/CheckIndexRunning";

const CreateIndex = () => {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const is_admin = await isAdmin(navigate);
                setIsAdminUser(is_admin);
                if (!is_admin) {
                    navigate("/chat");
                    return;
                }
                const filesData = await getFiles(navigate);
                const filesList = (filesData || []).map((name, index) => ({
                    id: index + 1,
                    name: name,
                    checked: false
                }));
                setFiles(filesList);
                await checkIndexRunning(navigate);
                setProcessing(localStorage.getItem("index_loading") === "true");
            } catch (error) {
                setError("Ошибка загрузки файлов");
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, [navigate]);

    const toggleFile = (id) => {
        setFiles(files.map(file => file.id === id ? {...file, checked: !file.checked} : file));
    };

    const uploadIndexButton = async () => {
        const selectedFiles = files.filter(file => file.checked);
        if (selectedFiles.length === 0) {
            setError("Выберите хотя бы один файл для создания индекса");
            return;
        }
        if (!input.trim()) {
            setError("Введите название индекса");
            return;
        }

        setError(null);
        const listFiles = selectedFiles.map(file => file.name);
        localStorage.setItem('index_loading', "true");
        setProcessing(true);
        
        try {
            await uploadIndexApi(listFiles, input.trim(), navigate);
            setSuccess(true);
            setInput("");
            setFiles(files.map(file => ({...file, checked: false})));
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (error) {
            setError("Ошибка создания индекса. Попробуйте позже.");
        } finally {
            localStorage.setItem('index_loading', "false");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const selectedCount = files.filter(f => f.checked).length;

    return (
        <div className="d-flex flex-column vh-100 bg-light">
            <Navbar isAdmin={isAdminUser} />
            <Container className="flex-grow-1 py-4">
                <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">Создание индекса</h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                                Индекс успешно создан!
                            </Alert>
                        )}

                        <h5 className="mb-3">Выберите файлы для создания индекса</h5>
                        {files.length === 0 ? (
                            <Alert variant="info">
                                Нет доступных файлов. Загрузите файлы на странице "Добавить файл".
                            </Alert>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <Badge bg="info" className="me-2">
                                        Выбрано: {selectedCount} из {files.length}
                                    </Badge>
                                </div>
                                <ListGroup className="mb-4" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    {files.map(file => (
                                        <ListGroup.Item 
                                            key={file.id}
                                            className="d-flex align-items-center"
                                            style={{cursor: 'pointer'}}
                                            onClick={() => toggleFile(file.id)}
                                        >
                                            <Form.Check
                                                type="checkbox"
                                                label={file.name}
                                                checked={file.checked}
                                                onChange={() => toggleFile(file.id)}
                                                className="flex-grow-1"
                                            />
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        <Form.Group controlId="indexName" className="mb-4">
                            <Form.Label className="fw-semibold">Название индекса</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Введите название индекса"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={processing}
                            />
                            <Form.Text className="text-muted">
                                Уникальное название для идентификации индекса
                            </Form.Text>
                        </Form.Group>

                        <Button 
                            onClick={uploadIndexButton} 
                            disabled={processing || selectedCount === 0 || !input.trim()} 
                            variant="primary"
                            size="lg"
                            className="w-100"
                        >
                            {processing ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Создание индекса...
                                </>
                            ) : (
                                "Создать индекс"
                            )}
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default CreateIndex;
