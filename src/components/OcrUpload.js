import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert, Badge, Button, Card, Container, Form,
    ProgressBar, Spinner, Table, Toast, ToastContainer,
} from 'react-bootstrap';
import Navbar from './Navbar';
import { isAdmin, isOwner } from '../api/IsAdmin';
import { refreshUserOrg } from '../api/GetToken';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/UploadFile';
import { getUploadedFiles } from '../api/GetUploadedFiles';
import { deleteFile } from '../api/DeleteFile';
import { getApiBaseUrl } from '../config';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
    pending_upload:  { text: 'Ожидание',      bg: 'secondary' },
    uploading:       { text: 'Загрузка',       bg: 'info'      },
    uploaded:        { text: 'Загружен',       bg: 'primary'   },
    ocr_processing:  { text: 'OCR...',         bg: 'warning'   },
    ocr_done:        { text: 'OCR готов',      bg: 'primary'   },
    rag_indexing:    { text: 'Индексация...',  bg: 'warning'   },
    indexed:         { text: 'Готов',          bg: 'success'   },
    failed:          { text: 'Ошибка',         bg: 'danger'    },
    dead:            { text: 'Убит watchdog',  bg: 'dark'      },
};

const statusBadge = (status) => {
    const { text, bg } = STATUS_LABEL[status] || { text: status, bg: 'secondary' };
    return <Badge bg={bg}>{text}</Badge>;
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const WS_URL = () => {
    const base = getApiBaseUrl().replace(/^http/, 'ws').replace('/api/v1', '');
    const token = localStorage.getItem('access_token');
    return `${base}/api/v1/ws?token=${token}`;
};

// ─── component ──────────────────────────────────────────────────────────────

const OcrUpload = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);        // list[File]
    const [loading, setLoading]             = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [batchInfo, setBatchInfo]         = useState(null);      // { current, total, name }
    const [error, setError]                 = useState(null);
    const [isAdminUser, setIsAdminUser]     = useState(false);
    const [isOwnerUser, setIsOwnerUser]     = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [files, setFiles]                 = useState([]);         // list[FileRecord]
    const [toasts, setToasts]               = useState([]);         // { id, title, body, bg }
    const [deletingId, setDeletingId]       = useState(null);
    const wsRef                             = useRef(null);
    const navigate                          = useNavigate();

    // ── toast helpers ──
    const addToast = useCallback((title, body, bg = 'primary') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, title, body, bg }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }, []);

    // ── update files list from WS message ──
    const applyStatusUpdate = useCallback(({ file_id, status, error_message }) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === file_id
                    ? { ...f, status, error_message: error_message ?? f.error_message }
                    : f
            )
        );
        const label = STATUS_LABEL[status]?.text ?? status;
        const bg = status === 'indexed' ? 'success' : status === 'failed' || status === 'dead' ? 'danger' : 'primary';
        addToast('Статус файла', `${label}${error_message ? ': ' + error_message : ''}`, bg);
    }, [addToast]);

    // ── WebSocket ──
    const connectWs = useCallback(() => {
        const ws = new WebSocket(WS_URL());
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'file_status') applyStatusUpdate(msg);
            } catch (_) {}
        };

        // keepalive ping every 25s
        const ping = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 25000);
        ws.onclose = (e) => {
            clearInterval(ping);
            if (e.code === 4001) {
                // auth rejected — token expired or invalid, redirect to login
                navigate('/login');
                return;
            }
            setTimeout(() => { if (wsRef.current === ws) connectWs(); }, 3000);
        };
    }, [applyStatusUpdate]);

    // ── init ──
    useEffect(() => {
        const init = async () => {
            try {
                await refreshUserOrg(navigate);
                const admin = isAdmin();
                setIsAdminUser(admin);
                setIsOwnerUser(isOwner());
                if (!admin) { navigate('/chat'); return; }

                const data = await getUploadedFiles(navigate);
                setFiles(data || []);
                connectWs();
            } catch {
                setError('Ошибка загрузки данных');
            } finally {
                setInitialLoading(false);
            }
        };
        init();
        return () => {
            if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
        };
    }, [navigate, connectWs]);

    // ── delete ──
    const handleDelete = async (fileId) => {
        if (!window.confirm('Удалить файл? Это действие нельзя отменить.')) return;
        setDeletingId(fileId);
        try {
            const ok = await deleteFile(fileId, navigate);
            if (ok) {
                setFiles((prev) => prev.filter((f) => f.id !== fileId));
            } else {
                addToast('Ошибка удаления', 'Не удалось удалить файл', 'danger');
            }
        } catch {
            addToast('Ошибка удаления', 'Не удалось удалить файл', 'danger');
        } finally {
            setDeletingId(null);
        }
    };

    // ── file input ──
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

    const handleFileChange = (e) => {
        const picked = Array.from(e.target.files || []);
        if (picked.length === 0) { setSelectedFiles([]); return; }

        const valid = [];
        const rejected = [];
        for (const f of picked) {
            if (f.type !== 'application/pdf') { rejected.push(`${f.name} — не PDF`); continue; }
            if (f.size > MAX_FILE_SIZE) { rejected.push(`${f.name} — больше 5 ГБ`); continue; }
            valid.push(f);
        }
        setSelectedFiles(valid);
        setError(rejected.length ? `Пропущены файлы: ${rejected.join('; ')}` : null);
    };

    // ── submit ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (selectedFiles.length === 0) { setError('Пожалуйста, выберите файл'); return; }

        setLoading(true);
        setError(null);

        const total = selectedFiles.length;
        const failed = [];

        // Загружаем по очереди, чтобы не перегружать сеть большими PDF и видеть прогресс по каждому
        for (let i = 0; i < total; i++) {
            const current = selectedFiles[i];
            setBatchInfo({ current: i + 1, total, name: current.name });
            setUploadProgress(0);
            try {
                const fileId = await uploadFile(current, navigate, (pct) => setUploadProgress(pct));

                // optimistically add to list (WS will update status further)
                setFiles((prev) => {
                    if (prev.find((f) => f.id === fileId)) return prev;
                    return [
                        { id: fileId, original_filename: current.name, display_name: null, status: 'uploaded',
                          error_message: null, created_at: new Date().toISOString() },
                        ...prev,
                    ];
                });
            } catch (err) {
                failed.push(`${current.name}: ${err.message || 'ошибка загрузки'}`);
            }
        }

        const ok = total - failed.length;
        if (ok > 0) {
            addToast('Загрузка завершена', `Отправлено файлов: ${ok} из ${total}`, failed.length ? 'warning' : 'success');
        }
        if (failed.length) setError(`Не удалось загрузить: ${failed.join('; ')}`);

        setSelectedFiles([]);
        form.reset();
        setLoading(false);
        setUploadProgress(null);
        setBatchInfo(null);
    };

    // ── render ──
    if (initialLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column vh-100 bg-light">
            <Navbar isAdmin={isAdminUser} isOwner={isOwnerUser} />

            {/* Toast container */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {toasts.map((t) => (
                    <Toast key={t.id} bg={t.bg} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>
                        <Toast.Header><strong className="me-auto">{t.title}</strong></Toast.Header>
                        <Toast.Body className={t.bg !== 'light' ? 'text-white' : ''}>{t.body}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>

            <Container className="flex-grow-1 py-4" style={{ maxWidth: 900 }}>
                {/* Upload card */}
                <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">Загрузка файлов</h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>
                        )}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group controlId="formFile" className="mb-4">
                                <Form.Label className="fw-semibold">Выберите PDF файлы</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Можно выбрать несколько файлов сразу. Максимальный размер файла: 5 ГБ. Поддерживаются только PDF файлы.
                                </Form.Text>
                                {selectedFiles.length > 0 && (
                                    <Alert variant="info" className="mt-2 mb-0">
                                        <strong>Выбрано файлов: {selectedFiles.length}</strong>
                                        <ul className="mb-0 mt-1 ps-3">
                                            {selectedFiles.map((f, i) => (
                                                <li key={i}>
                                                    {f.name}{' '}
                                                    <small className="text-muted">({(f.size / 1024 / 1024).toFixed(2)} МБ)</small>
                                                </li>
                                            ))}
                                        </ul>
                                    </Alert>
                                )}
                                {loading && uploadProgress !== null && (
                                    <div className="mt-3">
                                        {batchInfo && (
                                            <div className="mb-1">
                                                <small className="text-muted">
                                                    Файл {batchInfo.current} из {batchInfo.total}: {batchInfo.name}
                                                </small>
                                            </div>
                                        )}
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
                            <Button type="submit" variant="primary" disabled={loading || selectedFiles.length === 0} size="lg" className="w-100">
                                {loading
                                    ? <><Spinner animation="border" size="sm" className="me-2" />Загрузка{batchInfo ? ` ${batchInfo.current}/${batchInfo.total}` : ''}...</>
                                    : `Загрузить ${selectedFiles.length > 1 ? `файлы (${selectedFiles.length})` : 'файл'}`}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                {/* Files list */}
                <Card className="shadow-sm">
                    <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Файлы</h5>
                        <Button
                            size="sm"
                            variant="outline-light"
                            onClick={async () => { const d = await getUploadedFiles(navigate); setFiles(d || []); }}
                        >
                            Обновить
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {files.length === 0 ? (
                            <p className="text-muted p-3 mb-0">Файлов нет</p>
                        ) : (
                            <Table hover responsive className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Файл</th>
                                        <th>Статус</th>
                                        <th>Загружен</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((f) => (
                                        <tr key={f.id}>
                                            <td>
                                                {f.display_name || f.original_filename}
                                                {f.error_message && (
                                                    <div><small className="text-danger">{f.error_message}</small></div>
                                                )}
                                            </td>
                                            <td>{statusBadge(f.status)}</td>
                                            <td><small>{fmtDate(f.created_at)}</small></td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(f.id)}
                                                    disabled={deletingId === f.id}
                                                >
                                                    {deletingId === f.id
                                                        ? <Spinner animation="border" size="sm" />
                                                        : 'Удалить'}
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

export default OcrUpload;
