import React, {useState} from "react";
import {Button, Form, Card, Modal, Spinner, Alert} from "react-bootstrap";
import {X} from "react-bootstrap-icons";
import {sendStatistic} from "../api/SendStatistic";
import {useNavigate} from "react-router-dom";

const CorrectionForm = ({messageForCorrection, setMessageForCorrection, question, onClose}) => {
    const [correctedAnswer, setCorrectedAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleCorrectionSubmit = async (e) => {
        e.preventDefault();
        
        if (!correctedAnswer.trim()) {
            setError("Пожалуйста, введите правильный ответ");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            await sendStatistic(question, messageForCorrection, false, correctedAnswer, navigate);
            setSuccess(true);
            setTimeout(() => {
                setMessageForCorrection("");
                setCorrectedAnswer("");
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (error) {
            setError("Ошибка отправки исправления. Попробуйте позже.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={true} onHide={onClose} size="lg" centered>
            <Modal.Header className="bg-primary text-white">
                <Modal.Title>Исправление ответа</Modal.Title>
                <Button
                    variant="link"
                    onClick={onClose}
                    className="text-white"
                    style={{marginLeft: 'auto', padding: 0}}
                >
                    <X size={24} />
                </Button>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert variant="success">
                        Спасибо за обратную связь!
                    </Alert>
                )}

                <Form onSubmit={handleCorrectionSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Вопрос:</Form.Label>
                        <Card className="bg-light p-3">
                            <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{question}</p>
                        </Card>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Текущий ответ:</Form.Label>
                        <Card className="bg-light p-3">
                            <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{messageForCorrection}</p>
                        </Card>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Правильный ответ:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={6}
                            value={correctedAnswer}
                            onChange={(e) => setCorrectedAnswer(e.target.value)}
                            placeholder="Введите правильный ответ"
                            disabled={loading || success}
                        />
                        <Form.Text className="text-muted">
                            Пожалуйста, укажите, какой ответ должен был быть дан
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading || success}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || success || !correctedAnswer.trim()}
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Отправка...
                                </>
                            ) : (
                                "Отправить"
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CorrectionForm;
