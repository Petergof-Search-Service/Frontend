import React, {useEffect, useState, useRef} from "react";
import {Button, Form, Container, Row, Col, Card, Dropdown, ButtonGroup, Spinner, Badge, Alert} from "react-bootstrap";
import {askQuestion} from "../api/SendQuestion";
import {useNavigate} from "react-router-dom";
import CorrectionForm from "../components/CorrectionForm";
import {sendStatistic} from "../api/SendStatistic";
import DescriptionWindow from "./DescriptionWindow";
import {getIndexes} from "../api/GetIndexes";
import {isAdmin} from "../api/IsAdmin";
import Navbar from "./Navbar";
import { InfoCircle, ChevronDown, ChevronUp } from "react-bootstrap-icons";

const ChatComponent = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [indexes, setIndexes] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [asking, setAsking] = useState(false);
    const [selectIndex, setSelectIndex] = useState("");
    const [messageForCorrection, setMessageForCorrection] = useState("");
    const [questionForCorrection, setQuestionForCorrection] = useState("");
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [showDescriptionWindow, setShowDescriptionWindow] = useState(
        JSON.parse(localStorage.getItem("show_about") || "true")
    );
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [error, setError] = useState(null);

    // Загрузка сохраненного состояния при монтировании
    useEffect(() => {
        const savedMessages = localStorage.getItem("chat_messages");
        const savedIndex = localStorage.getItem("chat_selected_index");
        
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                setMessages(parsedMessages);
            } catch (error) {
                console.error("Error parsing saved messages:", error);
            }
        }
        
        if (savedIndex) {
            setSelectIndex(savedIndex);
        }
    }, []);

    useEffect(() => {
        const fetchIndexes = async () => {
            try {
                const data = await getIndexes(navigate);
                setIndexes(data || []);
                
                // Если индекс не был сохранен, выбираем первый доступный
                const savedIndex = localStorage.getItem("chat_selected_index");
                if (data && data.length > 0) {
                    if (savedIndex && data.includes(savedIndex)) {
                        setSelectIndex(savedIndex);
                    } else {
                        setSelectIndex(data[0]);
                        localStorage.setItem("chat_selected_index", data[0]);
                    }
                }
                
                const adminStatus = await isAdmin(navigate);
                setIsAdminUser(adminStatus);
            } catch (error) {
                setError("Ошибка загрузки данных. Пожалуйста, обновите страницу.");
            }
        };
        fetchIndexes();
    }, [navigate]);

    // Сохранение сообщений при их изменении
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("chat_messages", JSON.stringify(messages));
        }
    }, [messages]);

    // Сохранение выбранного индекса при его изменении
    useEffect(() => {
        if (selectIndex) {
            localStorage.setItem("chat_selected_index", selectIndex);
        }
    }, [selectIndex]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async () => {
        if (!input.trim() || asking) return;
        if (!selectIndex) {
            setError("Пожалуйста, выберите индекс");
            return;
        }

        const userMessage = {id: Date.now(), text: input.trim(), sender: "user"};
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setAsking(true);
        setError(null);

        try {
            const response = await askQuestion(selectIndex, input.trim(), navigate);
            const botResponse = {
                id: Date.now() + 1,
                text: response,
                sender: "bot",
                liked: null
            };
            setMessages(prev => [...prev, botResponse]);
        } catch (error) {
            setError("Ошибка при отправке вопроса. Попробуйте еще раз.");
            setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        } finally {
            setAsking(false);
        }
    };

    const handleLike = async (id, is_like) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === id ? {...msg, liked: is_like} : msg
            )
        );
        const message = messages.find(item => item.id === id);
        const questionIndex = messages.findIndex(item => item.id === id) - 1;
        const question = questionIndex >= 0 ? messages[questionIndex].text : "";

        if (!is_like) {
            setMessageForCorrection(message.text);
            setQuestionForCorrection(question);
            setShowCorrectionForm(true);
        } else {
            try {
                await sendStatistic(question, message.text, true, null, navigate);
            } catch (error) {
                console.error("Error sending statistic:", error);
            }
        }
    };

    const handleCorrectionClose = () => {
        setShowCorrectionForm(false);
        setMessageForCorrection("");
        setQuestionForCorrection("");
    };

    const formatMessage = (text, isBot = false) => {
        if (!isBot) {
            // Для сообщений пользователя просто форматируем
            const lines = text.split('\n');
            return lines.map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < lines.length - 1 && <br />}
                </React.Fragment>
            ));
        }

        // Для сообщений бота разделяем по разделителю с бэка (answer + 8 переносов + source)
        const delimiter = "\n\n\n\n\n\n\n\n";
        const parts = text.split(delimiter);
        const visiblePart = (parts[0] || "").trim();
        const hiddenPart = (parts[1] || "").trim();

        if (!hiddenPart) {
            // Нет блока источников — просто форматируем весь текст
            const lines = text.split('\n');
            return lines.map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < lines.length - 1 && <br />}
                </React.Fragment>
            ));
        }

        if (!visiblePart) {
            // Видимая часть пуста — весь контент под спойлером (источники)
            const hiddenLines = hiddenPart.split('\n');
            const formattedHidden = hiddenLines.map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < hiddenLines.length - 1 && <br />}
                </React.Fragment>
            ));
            return <SpoilerContent content={formattedHidden} />;
        }

        // Форматируем видимую часть
        const visibleLines = visiblePart.split('\n');
        const formattedVisible = visibleLines.map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < visibleLines.length - 1 && <br />}
            </React.Fragment>
        ));

        // Форматируем скрытую часть (источники)
        const hiddenLines = hiddenPart.split('\n');
        const formattedHidden = hiddenLines.map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < hiddenLines.length - 1 && <br />}
            </React.Fragment>
        ));

        return (
            <>
                {formattedVisible}
                <SpoilerContent content={formattedHidden} />
            </>
        );
    };

    const SpoilerContent = ({ content }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="mt-2">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="d-flex align-items-center gap-1 border-0"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--hover-bg)',
                        color: 'var(--text-primary)',
                        padding: '0.3rem 0.6rem',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    {isOpen ? (
                        <>
                            <ChevronUp size={14} />
                            <span>Скрыть</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown size={14} />
                            <span>Подробнее об источниках</span>
                        </>
                    )}
                </Button>
                {isOpen && (
                    <div 
                        className="mt-2 p-2 rounded border" 
                        style={{
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-word',
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        {content}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="d-flex flex-column vh-100" style={{backgroundColor: 'var(--bg-tertiary)'}}>
            <Navbar isAdmin={isAdminUser} />
            
            <Container fluid className="flex-grow-1 d-flex flex-column p-0" style={{overflow: 'hidden'}}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)} className="m-2 mb-0">
                        {error}
                    </Alert>
                )}

                <div className="flex-grow-1 p-2 overflow-auto" style={{backgroundColor: 'var(--bg-tertiary)'}}>
                    {messages.length === 0 ? (
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight: '150px', paddingTop: '1rem'}}>
                            <div className="text-center">
                                <div className="mb-2">
                                    <InfoCircle size={24} className="text-primary opacity-60" />
                                </div>
                                <h6 className="fw-semibold mb-1" style={{fontSize: '0.95rem', color: 'var(--text-primary)'}}>Начните диалог</h6>
                                <p className="mb-0" style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Выберите индекс и задайте вопрос</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`d-flex mb-2 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"} message-enter`}
                            >
                                <Card
                                    className={`${msg.sender === "user" ? "bg-primary text-white" : ""} shadow-sm`}
                                    style={{
                                        maxWidth: "80%",
                                        minWidth: "250px",
                                        borderRadius: "1rem",
                                        backgroundColor: msg.sender === "user" ? undefined : 'var(--card-bg)',
                                        color: msg.sender === "user" ? undefined : 'var(--text-primary)',
                                        border: msg.sender === "user" ? 'none' : '1px solid var(--border-color)'
                                    }}
                                >
                                    <Card.Body className="p-2">
                                        <div className="d-flex justify-content-between align-items-start gap-2">
                                            <div className="flex-grow-1" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                                {formatMessage(msg.text, msg.sender === "bot")}
                                            </div>
                                            {msg.sender === "bot" && (
                                                <ButtonGroup size="sm" className="flex-shrink-0">
                                                    <Button
                                                        variant={msg.liked === true ? "success" : "outline-success"}
                                                        onClick={() => handleLike(msg.id, true)}
                                                        className="border-0"
                                                        style={{padding: '0.25rem 0.5rem'}}
                                                    >
                                                        👍
                                                    </Button>
                                                    <Button
                                                        variant={msg.liked === false ? "danger" : "outline-danger"}
                                                        onClick={() => handleLike(msg.id, false)}
                                                        className="border-0"
                                                        style={{padding: '0.25rem 0.5rem'}}
                                                    >
                                                        👎
                                                    </Button>
                                                </ButtonGroup>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        ))
                    )}
                    {asking && (
                        <div className="d-flex justify-content-start mb-2">
                            <Card className="shadow-sm" style={{
                                borderRadius: "1rem",
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <Card.Body className="p-2">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    <span style={{color: 'var(--text-secondary)'}}>Думаю...</span>
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-top p-2 shadow-sm" style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)'
                }}>
                    <Row className="g-2 align-items-end">
                        <Col>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Введите вопрос..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        await sendMessage();
                                    }
                                }}
                                disabled={asking}
                                style={{
                                    resize: 'none',
                                    backgroundColor: 'var(--input-bg)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                            />
                        </Col>
                        <Col xs="auto">
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" id="dropdown-index" style={{
                                    backgroundColor: 'var(--input-bg)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    padding: '0.5rem 1rem'
                                }}>
                                    {selectIndex || "Выберите индекс"}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {indexes.length === 0 ? (
                                        <Dropdown.Item disabled>Нет доступных индексов</Dropdown.Item>
                                    ) : (
                                        indexes.map((index) => (
                                            <Dropdown.Item 
                                                key={index}
                                                onClick={() => setSelectIndex(index)}
                                                active={selectIndex === index}
                                            >
                                                {index}
                                            </Dropdown.Item>
                                        ))
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                        <Col xs="auto">
                            <Button
                                variant="outline-info"
                                onClick={() => setShowDescriptionWindow(true)}
                                title="Справка"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    padding: 0,
                                    fontSize: '1.2rem'
                                }}
                            >
                                ?
                            </Button>
                        </Col>
                        <Col xs="auto">
                            <Button 
                                onClick={sendMessage} 
                                disabled={asking || !input.trim() || !selectIndex}
                                size="lg"
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    fontSize: '1rem'
                                }}
                            >
                                {asking ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Отправка...
                                    </>
                                ) : (
                                    "Отправить"
                                )}
                            </Button>
                        </Col>
                    </Row>
                    {selectIndex && (
                        <div className="mt-2">
                            <Badge bg="info" className="text-white" style={{fontSize: '0.9rem', padding: '0.4rem 0.8rem'}}>
                                Индекс: {selectIndex}
                            </Badge>
                        </div>
                    )}
                </div>
            </Container>

            {showCorrectionForm && (
                <CorrectionForm
                    messageForCorrection={messageForCorrection}
                    setMessageForCorrection={setMessageForCorrection}
                    question={questionForCorrection}
                    onClose={handleCorrectionClose}
                />
            )}

            {showDescriptionWindow && (
                <DescriptionWindow
                    onClose={() => {
                        setShowDescriptionWindow(false);
                        localStorage.setItem('show_about', "false");
                    }}
                />
            )}
        </div>
    );
};

export default ChatComponent;
