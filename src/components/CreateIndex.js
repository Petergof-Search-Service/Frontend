import React, { useCallback, useEffect, useState } from "react";
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
import { deleteIndex } from "../api/DeleteIndex";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";

// Интервал опроса статуса сборки, мс. Индекс строится минуты—часы на стороне
// AI Studio; фронт просто периодически перечитывает список, пока есть building.
const POLL_INTERVAL_MS = 4000;

const StatusBadge = ({ status, progress, error }) => {
    if (status === "building") {
        const p = progress && progress.total ? ` ${progress.completed}/${progress.total}` : "";
        return (
            <Badge bg="warning" text="dark">
                <Spinner
                    animation="border"
                    size="sm"
                    className="me-1"
                    style={{ width: "0.7rem", height: "0.7rem", borderWidth: "0.15em" }}
                />
                Создаётся{p}
            </Badge>
        );
    }
    if (status === "ready") return <Badge bg="success">Готов</Badge>;
    if (status === "failed") {
        return (
            <Badge bg="danger" title={error || "Ошибка сборки"}>
                Ошибка
            </Badge>
        );
    }
    return <Badge bg="secondary">{status || "—"}</Badge>;
};

const CreateIndex = () => {
    const [files, setFiles]             = useState([]);
    const [indexes, setIndexes]         = useState([]);
    const [creating, setCreating]       = useState(false);
    const [input, setInput]             = useState("");
    const [loading, setLoading]         = useState(true);
    const [toasts, setToasts]           = useState([]);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isOwnerUser, setIsOwnerUser] = useState(false);
    const navigate                      = useNavigate();

    const addToast = useCallback((title, body, bg = "primary") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, title, body, bg }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }, []);

    const reloadIndexes = useCallback(async () => {
        const d = await getIndexes(navigate);
        if (d) setIndexes(d);
    }, [navigate]);

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
            } catch {
                addToast("Ошибка", "Ошибка загрузки данных", "danger");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate, addToast]);

    // Пока есть строящиеся индексы — периодически перечитываем список.
    // Как только building не осталось, интервал очищается.
    const hasBuilding = indexes.some((i) => i.status === "building");
    useEffect(() => {
        if (!hasBuilding) return;
        const timer = setInterval(reloadIndexes, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [hasBuilding, reloadIndexes]);

    const toggleFile = (id) =>
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, checked: !f.checked } : f));

    const handleCreate = async () => {
        const selectedIds = files.filter((f) => f.checked).map((f) => f.id);
        if (selectedIds.length === 0 || !input.trim()) return;

        setCreating(true);
        try {
            await uploadIndexApi(selectedIds, input.trim(), navigate);
            setInput("");
            setFiles((prev) => prev.map((f) => ({ ...f, checked: false })));
            addToast("Индекс создаётся", "Сборка запущена, статус обновится автоматически", "info");
            await reloadIndexes();
        } catch {
            addToast("Ошибка", "Не удалось запустить создание индекса", "danger");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (idx) => {
        if (!window.confirm(`Удалить индекс «${idx.name}»?`)) return;
        const ok = await deleteIndex(idx.id, navigate);
        if (ok) {
            setIndexes((prev) => prev.filter((i) => i.id !== idx.id));
            addToast("Индекс удалён", `«${idx.name}» удалён`, "success");
        } else {
            addToast("Ошибка", "Не удалось удалить индекс", "danger");
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
                                disabled={creating}
                            />
                        </Form.Group>

                        <Button
                            onClick={handleCreate}
                            disabled={creating || selectedCount === 0 || !input.trim()}
                            variant="primary"
                            size="lg"
                            className="w-100"
                        >
                            {creating ? (
                                <><Spinner animation="border" size="sm" className="me-2" />Запуск сборки...</>
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
                        <Button size="sm" variant="outline-light" onClick={reloadIndexes}>
                            Обновить
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {indexes.length === 0 ? (
                            <p className="text-muted p-3 mb-0">Индексов нет</p>
                        ) : (
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Название</th>
                                        <th>Статус</th>
                                        <th>Создан</th>
                                        <th className="text-end">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {indexes.map((idx) => (
                                        <tr key={idx.id}>
                                            <td>{idx.name}</td>
                                            <td>
                                                <StatusBadge
                                                    status={idx.status}
                                                    progress={idx.progress}
                                                    error={idx.error_message}
                                                />
                                            </td>
                                            <td><small>{fmtDate(idx.created_at)}</small></td>
                                            <td className="text-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    disabled={idx.status === "building"}
                                                    title={idx.status === "building"
                                                        ? "Нельзя удалить, пока индекс создаётся"
                                                        : "Удалить индекс"}
                                                    onClick={() => handleDelete(idx)}
                                                >
                                                    Удалить
                                                </Button>
                                            </td>
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
