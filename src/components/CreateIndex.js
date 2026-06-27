import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert, Badge, Button, Card, Container, Form,
    ListGroup, Spinner, Table, Toast, ToastContainer,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { isAdmin, isOwner } from "../api/IsAdmin";
import { refreshUserOrg } from "../api/GetToken";
import { uploadIndexApi } from "../api/UploadIndex";
import { getFiles } from "../api/GetFiles";
import { getIndexes } from "../api/GetIndexes";
import { getApiBaseUrl } from "../config";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";

const WS_URL = () => {
    const base = getApiBaseUrl().replace(/^http/, "ws").replace("/api/v1", "");
    const token = localStorage.getItem("access_token");
    return `${base}/api/v1/ws?token=${token}`;
};

const CreateIndex = () => {
    const [files, setFiles]             = useState([]);
    const [indexes, setIndexes]         = useState([]);
    const [processing, setProcessing]   = useState(false);
    const [input, setInput]             = useState("");
    const [loading, setLoading]         = useState(true);
    const [toasts, setToasts]           = useState([]);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isOwnerUser, setIsOwnerUser] = useState(false);
    const wsRef                         = useRef(null);
    const navigate                      = useNavigate();

    const addToast = useCallback((title, body, bg = "primary") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, title, body, bg }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }, []);

    const applyIndexStatus = useCallback(({ status, index, error }) => {
        if (status === "running") {
            setProcessing(true);
        } else if (status === "done") {
            setProcessing(false);
            if (index) setIndexes((prev) => [index, ...prev]);
            addToast("Индекс создан", `«${index?.name}» успешно создан`, "success");
        } else if (status === "error") {
            setProcessing(false);
            addToast("Ошибка создания индекса", error || "Неизвестная ошибка", "danger");
        }
    }, [addToast]);

    const connectWs = useCallback(() => {
        const ws = new WebSocket(WS_URL());
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === "index_status") applyIndexStatus(msg);
            } catch (_) {}
        };

        const ping = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 25000);

        ws.onclose = (e) => {
            clearInterval(ping);
            if (e.code === 4001) { navigate("/login"); return; }
            setTimeout(() => { if (wsRef.current === ws) connectWs(); }, 3000);
        };
    }, [applyIndexStatus, navigate]);

    useEffect(() => {
        const init = async () => {
            try {
                await refreshUserOrg(navigate);
                const admin = isAdmin();
                setIsAdminUser(admin);
                setIsOwnerUser(isOwner());
                if (!admin) { navigate("/chat"); return; }

                const [filesData, indexesData] = await Promise.all([
                    getFiles(navigate),
                    getIndexes(navigate),
                ]);
                setFiles((filesData || []).map((f) => ({ ...f, checked: false })));
                setIndexes(indexesData || []);
                connectWs();
            } catch {
                addToast("Ошибка", "Ошибка загрузки данных", "danger");
            } finally {
                setLoading(false);
            }
        };
        init();
        return () => {
            if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
        };
    }, [navigate, connectWs, addToast]);

    const toggleFile = (id) =>
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, checked: !f.checked } : f));

    const handleCreate = async () => {
        const selectedIds = files.filter((f) => f.checked).map((f) => f.id);
        if (selectedIds.length === 0 || !input.trim()) return;

        try {
            await uploadIndexApi(selectedIds, input.trim(), navigate);
            setInput("");
            setFiles((prev) => prev.map((f) => ({ ...f, checked: false })));
        } catch {
            addToast("Ошибка", "Не удалось отправить запрос на создание индекса", "danger");
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const selectedCount = files.filter((f) => f.checked).length;

    return (
        <div className="d-flex flex-column vh-100 bg-light">
            <Navbar isAdmin={isAdminUser} isOwner={isOwnerUser} />

            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {toasts.map((t) => (
                    <Toast key={t.id} bg={t.bg} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>
                        <Toast.Header><strong className="me-auto">{t.title}</strong></Toast.Header>
                        <Toast.Body className={t.bg !== "light" ? "text-white" : ""}>{t.body}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>

            <Container className="flex-grow-1 py-4" style={{ maxWidth: 900 }}>
                {/* Create index card */}
                <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">Создание индекса</h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                        <h5 className="mb-3">Выберите файлы</h5>
                        {files.length === 0 ? (
                            <Alert variant="info">
                                Нет доступных файлов. Загрузите файлы на странице «Добавить файл».
                            </Alert>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <Badge bg="info">Выбрано: {selectedCount} из {files.length}</Badge>
                                </div>
                                <ListGroup className="mb-4" style={{ maxHeight: 300, overflowY: "auto" }}>
                                    {files.map((file) => (
                                        <ListGroup.Item
                                            key={file.id}
                                            className="d-flex align-items-center"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => toggleFile(file.id)}
                                        >
                                            {/* Переключение делает только строка (onClick выше).
                                                Сам чекбокс — визуальный (readOnly), pointer-events:none,
                                                чтобы клик по квадратику не вызывал toggle дважды. */}
                                            <Form.Check
                                                type="checkbox"
                                                label={file.name}
                                                checked={file.checked}
                                                readOnly
                                                className="flex-grow-1"
                                                style={{ pointerEvents: "none" }}
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
                        </Form.Group>

                        <Button
                            onClick={handleCreate}
                            disabled={processing || selectedCount === 0 || !input.trim()}
                            variant="primary"
                            size="lg"
                            className="w-100"
                        >
                            {processing ? (
                                <><Spinner animation="border" size="sm" className="me-2" />Создание индекса...</>
                            ) : (
                                "Создать индекс"
                            )}
                        </Button>
                    </Card.Body>
                </Card>

                {/* Indexes table */}
                <Card className="shadow-sm">
                    <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Индексы</h5>
                        <Button
                            size="sm"
                            variant="outline-light"
                            onClick={async () => { const d = await getIndexes(navigate); setIndexes(d || []); }}
                        >
                            Обновить
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {indexes.length === 0 ? (
                            <p className="text-muted p-3 mb-0">Индексов нет</p>
                        ) : (
                            <Table hover responsive className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Название</th>
                                        <th>Создан</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {indexes.map((idx) => (
                                        <tr key={idx.id}>
                                            <td>{idx.name}</td>
                                            <td><small>{fmtDate(idx.created_at)}</small></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default CreateIndex;
