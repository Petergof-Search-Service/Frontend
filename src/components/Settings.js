import React, {useEffect, useState} from "react";
import {Form, Container, Button, Card, Spinner, Alert, Badge} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import Navbar from "./Navbar";
import {isAdmin, isOwner} from "../api/IsAdmin";
import {refreshUserOrg} from "../api/GetToken";
import {getSettings} from "../api/GetSettings";
import {sendSettings} from "../api/SendSettings";
import {DEFAULT_RAG_PROMPT} from "../constants/settings";

const Settings = () => {
    const [settings, setSettings] = useState({
        prompt: "",
        temperature: 0,
        count_vector: 0,
        count_fulltext: 0
    });
    const navigate = useNavigate();
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isOwnerUser, setIsOwnerUser] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                await refreshUserOrg(navigate);
                setIsAdminUser(isAdmin());
                setIsOwnerUser(isOwner());
                
                const data = await getSettings(navigate);
                if (data) {
                    setSettings({
                        prompt: data.prompt || "",
                        temperature: data.temperature || 0,
                        count_vector: data.count_vector || 0,
                        count_fulltext: data.count_fulltext || 0
                    });
                }
            } catch (error) {
                setError("Ошибка загрузки настроек");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [navigate]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await sendSettings(settings, navigate);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            setError("Ошибка сохранения настроек");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSettings({
            prompt: DEFAULT_RAG_PROMPT,
            temperature: 0.2,
            count_vector: 15,
            count_fulltext: 5,
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column vh-100 bg-light">
            <Navbar isAdmin={isAdminUser} isOwner={isOwnerUser} />
            <Container className="flex-grow-1 py-4">
                <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">Настройки</h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                                Настройки успешно сохранены!
                            </Alert>
                        )}

                        <Form.Group controlId="promptInput" className="mb-4">
                            <Form.Label className="fw-semibold">Значение промпта</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Введите промпт"
                                value={settings.prompt}
                                onChange={(e) => updateSetting('prompt', e.target.value)}
                                disabled={saving}
                            />
                            <Form.Text className="text-muted">
                                Промпт, который будет использоваться для генерации ответов
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="temperatureInput" className="mb-4">
                            <Form.Label className="fw-semibold">
                                Температура: <Badge bg="secondary">{settings.temperature}</Badge>
                            </Form.Label>
                            <Form.Range
                                min={0}
                                max={1}
                                step={0.01}
                                value={settings.temperature}
                                onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                                disabled={saving}
                            />
                            <Form.Text className="text-muted">
                                Контролирует случайность ответов (0 = детерминированный, 1 = более творческий)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="vectorInput" className="mb-4">
                            <Form.Label className="fw-semibold">
                                Количество элементов векторным поиском: <Badge bg="secondary">{settings.count_vector}</Badge>
                            </Form.Label>
                            <Form.Range
                                min={1}
                                max={30}
                                step={1}
                                value={settings.count_vector}
                                onChange={(e) => updateSetting('count_vector', parseInt(e.target.value))}
                                disabled={saving}
                            />
                            <Form.Text className="text-muted">
                                Количество документов для векторного поиска (1-30)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="fulltextInput" className="mb-4">
                            <Form.Label className="fw-semibold">
                                Количество элементов полнотекстовым поиском: <Badge bg="secondary">{settings.count_fulltext}</Badge>
                            </Form.Label>
                            <Form.Range
                                min={1}
                                max={30}
                                step={1}
                                value={settings.count_fulltext}
                                onChange={(e) => updateSetting('count_fulltext', parseInt(e.target.value))}
                                disabled={saving}
                            />
                            <Form.Text className="text-muted">
                                Количество документов для полнотекстового поиска (1-30)
                            </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-between gap-2 mt-4">
                            <Button
                                variant="outline-secondary"
                                onClick={handleReset}
                                disabled={saving}
                            >
                                Сбросить
                            </Button>

                            <Button
                                variant="primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Сохранение...
                                    </>
                                ) : (
                                    "Сохранить"
                                )}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default Settings;
