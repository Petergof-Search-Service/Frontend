import React, {useEffect, useState, useRef} from "react";
import {Button, Form, Container, Row, Col, Card, Dropdown, ButtonGroup, Spinner, Badge, Alert} from "react-bootstrap";
import {askQuestion} from "../api/SendQuestion";
import {useNavigate, useParams} from "react-router-dom";
import CorrectionForm from "../components/CorrectionForm";
import {sendStatistic} from "../api/SendStatistic";
import DescriptionWindow from "./DescriptionWindow";
import {getIndexes} from "../api/GetIndexes";
import {isAdmin, isOwner} from "../api/IsAdmin";
import {refreshUserOrg} from "../api/GetToken";
import {getHistory} from "../api/GetHistory";
import {getChats} from "../api/GetChats";
import {createChat} from "../api/CreateChat";
import {deleteChat} from "../api/DeleteChat";
import Navbar from "./Navbar";
import ChatSidebar from "./ChatSidebar";
import { InfoCircle, ChevronDown, ChevronUp } from "react-bootstrap-icons";

const ChatComponent = () => {
    const navigate = useNavigate();
    const { chatId: chatIdParam } = useParams();
    const activeChatId = chatIdParam ? parseInt(chatIdParam, 10) : null;

    const messagesEndRef = useRef(null);
    const [indexes, setIndexes] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [asking, setAsking] = useState(false);
    const [selectIndex, setSelectIndex] = useState(null);
    const [messageForCorrection, setMessageForCorrection] = useState("");
    const [questionForCorrection, setQuestionForCorrection] = useState("");
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [showDescriptionWindow, setShowDescriptionWindow] = useState(
        JSON.parse(localStorage.getItem("show_about") || "true")
    );
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isOwnerUser, setIsOwnerUser] = useState(false);
    const [error, setError] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [chats, setChats] = useState([]);
    const [chatsLoading, setChatsLoading] = useState(true);

    const convertServerMessages = (serverMessages) =>
        serverMessages.map((msg) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.role === "user" ? "user" : "bot",
            liked: null,
            context: msg.context ?? null,
        }));

    // Загрузка списка чатов
    useEffect(() => {
        setChatsLoading(true);
        getChats(navigate).then((data) => {
            if (data) setChats(data);
            setChatsLoading(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Загрузка сообщений при смене активного чата
    useEffect(() => {
        if (!activeChatId) {
            setMessages([]);
            return;
        }

        const cacheKey = `chat_messages_${activeChatId}`;
        const savedMessages = localStorage.getItem(cacheKey);
        if (savedMessages) {
            try { setMessages(JSON.parse(savedMessages)); } catch { localStorage.removeItem(cacheKey); }
        } else {
            setMessages([]);
        }

        setHistoryLoading(true);
        getHistory(activeChatId, navigate).then((serverMessages) => {
            if (serverMessages) {
                const converted = convertServerMessages(serverMessages);
                setMessages(converted);
                localStorage.setItem(cacheKey, JSON.stringify(converted));
            }
            setHistoryLoading(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChatId]);

    // Загрузка индексов и прав
    useEffect(() => {
        const fetchIndexes = async () => {
            try {
                const data = await getIndexes(navigate);
                setIndexes(data || []);

                const savedId = localStorage.getItem("chat_selected_index");
                if (data && data.length > 0) {
                    const saved = savedId ? data.find(i => String(i.id) === savedId) : null;
                    const chosen = saved || data[0];
                    setSelectIndex(chosen);
                    localStorage.setItem("chat_selected_index", chosen.id);
                }

                await refreshUserOrg(navigate);
                setIsAdminUser(isAdmin());
                setIsOwnerUser(isOwner());
            } catch {
                setError("Ошибка загрузки данных. Пожалуйста, обновите страницу.");
            }
        };
        fetchIndexes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Кэшировать сообщения при изменении
    useEffect(() => {
        if (activeChatId && messages.length > 0) {
            localStorage.setItem(`chat_messages_${activeChatId}`, JSON.stringify(messages));
        }
    }, [messages, activeChatId]);

    useEffect(() => {
        if (selectIndex) localStorage.setItem("chat_selected_index", selectIndex.id);
    }, [selectIndex]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleCreateChat = async () => {
        const chat = await createChat(navigate);
        if (chat) {
            setChats(prev => [chat, ...prev]);
            navigate(`/chat/${chat.id}`);
        }
    };

    const handleDeleteChat = async (chatId) => {
        const ok = await deleteChat(chatId, navigate);
        if (ok) {
            localStorage.removeItem(`chat_messages_${chatId}`);
            const remaining = chats.filter(c => c.id !== chatId);
            setChats(remaining);
            if (chatId === activeChatId) {
                if (remaining.length > 0) {
                    navigate(`/chat/${remaining[0].id}`);
                } else {
                    navigate('/chat');
                }
            }
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || asking) return;
        if (!selectIndex) { setError("Пожалуйста, выберите индекс"); return; }

        let chatId = activeChatId;
        let isNewChat = false;
        const inputText = input.trim();

        if (!chatId) {
            const newChat = await createChat(navigate);
            if (!newChat) { setError("Не удалось создать чат"); return; }
            chatId = newChat.id;
            isNewChat = true;
            setChats(prev => [newChat, ...prev]);
        }

        const userMessage = {id: Date.now(), text: inputText, sender: "user"};
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setAsking(true);
        setError(null);

        try {
            const response = await askQuestion(selectIndex?.id, inputText, chatId, navigate);
            const botResponse = {
                id: Date.now() + 1,
                text: response.answer,
                context: response.context,
                sender: "bot",
                liked: null
            };
            setMessages(prev => [...prev, botResponse]);

            setChats(prev => prev.map(c =>
                c.id === chatId && c.title === "Новый чат"
                    ? { ...c, title: inputText.slice(0, 60) }
                    : c
            ));

            if (isNewChat) {
                // Записываем в localStorage до навигации — эффект загрузки истории
                // найдёт сообщения и не будет делать лишний запрос к серверу
                localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify([userMessage, botResponse]));
                navigate(`/chat/${chatId}`, { replace: true });
            }
        } catch {
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
            } catch {
                console.error("Error sending statistic");
            }
        }
    };

    const handleCorrectionClose = () => {
        setShowCorrectionForm(false);
        setMessageForCorrection("");
        setQuestionForCorrection("");
    };

    const formatMessage = (text, isBot = false, context = null) => {
        const formatLines = (str) => str.split('\n').map((line, index, arr) => (
            <React.Fragment key={index}>
                {line}
                {index < arr.length - 1 && <br />}
            </React.Fragment>
        ));

        if (!isBot) return formatLines(text);

        const formattedAnswer = formatLines(text || "");
        const trimmedContext = (context || "").trim();
        if (!trimmedContext) return formattedAnswer;

        return (
            <>
                {formattedAnswer}
                <SpoilerContent content={formatLines(trimmedContext)} />
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
                    {isOpen ? <><ChevronUp size={14} /><span>Скрыть</span></> : <><ChevronDown size={14} /><span>Подробнее об источниках</span></>}
                </Button>
                {isOpen && (
                    <div className="mt-2 p-2 rounded border" style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                    }}>
                        {content}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="d-flex flex-column vh-100" style={{backgroundColor: 'var(--bg-tertiary)'}}>
            <Navbar isAdmin={isAdminUser} isOwner={isOwnerUser} />

            <div className="d-flex flex-grow-1" style={{overflow: 'hidden'}}>
                <ChatSidebar
                    chats={chats}
                    activeChatId={activeChatId}
                    onSelect={(id) => navigate(`/chat/${id}`)}
                    onCreate={handleCreateChat}
                    onDelete={handleDeleteChat}
                    loading={chatsLoading}
                />

                <Container fluid className="flex-grow-1 d-flex flex-column p-0" style={{overflow: 'hidden'}}>
                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)} className="m-2 mb-0">
                            {error}
                        </Alert>
                    )}

                    <div className="flex-grow-1 p-2 overflow-auto" style={{backgroundColor: 'var(--bg-tertiary)'}}>
                        {!activeChatId ? (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                <div className="text-center">
                                    <h6 className="fw-semibold mb-1" style={{color: 'var(--text-primary)'}}>Выберите чат или создайте новый</h6>
                                    <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Используйте панель слева</p>
                                </div>
                            </div>
                        ) : historyLoading && messages.length === 0 ? (
                            <div className="d-flex align-items-center justify-content-center" style={{minHeight: '150px'}}>
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span style={{color: 'var(--text-secondary)'}}>Загрузка истории...</span>
                            </div>
                        ) : messages.length === 0 ? (
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
                                                    {formatMessage(msg.text, msg.sender === "bot", msg.context)}
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
                                        {selectIndex?.name || "Выберите индекс"}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {indexes.length === 0 ? (
                                            <Dropdown.Item disabled>Нет доступных индексов</Dropdown.Item>
                                        ) : (
                                            indexes.map((idx) => (
                                                <Dropdown.Item
                                                    key={idx.id}
                                                    onClick={() => setSelectIndex(idx)}
                                                    active={selectIndex?.id === idx.id}
                                                >
                                                    {idx.name}
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
                                    style={{width: '40px', height: '40px', padding: 0, fontSize: '1.2rem'}}
                                >
                                    ?
                                </Button>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    onClick={sendMessage}
                                    disabled={asking || !input.trim() || !selectIndex}
                                    size="lg"
                                    style={{padding: '0.5rem 1.5rem', fontSize: '1rem'}}
                                >
                                    {asking ? (
                                        <><Spinner animation="border" size="sm" className="me-2" />Отправка...</>
                                    ) : "Отправить"}
                                </Button>
                            </Col>
                        </Row>
                        {selectIndex && (
                            <div className="mt-2">
                                <Badge bg="info" className="text-white" style={{fontSize: '0.9rem', padding: '0.4rem 0.8rem'}}>
                                    Индекс: {selectIndex?.name}
                                </Badge>
                            </div>
                        )}
                    </div>
                </Container>
            </div>

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
