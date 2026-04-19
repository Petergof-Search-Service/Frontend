import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { PlusLg, Trash } from 'react-bootstrap-icons';

const ChatSidebar = ({ chats, activeChatId, onSelect, onCreate, onDelete, loading }) => {
    return (
        <div
            className="d-flex flex-column border-end"
            style={{
                width: '260px',
                minWidth: '260px',
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                overflow: 'hidden',
            }}
        >
            <div className="p-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <Button
                    variant="outline-primary"
                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={onCreate}
                    disabled={loading}
                >
                    <PlusLg size={16} />
                    Новый чат
                </Button>
            </div>

            <div className="flex-grow-1 overflow-auto">
                {loading && chats.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center p-4">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : chats.length === 0 ? (
                    <div className="p-3 text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Нет чатов
                    </div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            className="d-flex align-items-center px-2 py-2"
                            style={{
                                cursor: 'pointer',
                                backgroundColor: chat.id === activeChatId ? 'var(--hover-bg)' : 'transparent',
                                borderLeft: chat.id === activeChatId ? '3px solid var(--bs-primary)' : '3px solid transparent',
                            }}
                            onClick={() => onSelect(chat.id)}
                        >
                            <span
                                className="flex-grow-1 text-truncate me-1"
                                style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-primary)',
                                    userSelect: 'none',
                                }}
                                title={chat.title}
                            >
                                {chat.title}
                            </span>
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 flex-shrink-0"
                                style={{ color: 'var(--text-secondary)', lineHeight: 1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(chat.id);
                                }}
                                title="Удалить чат"
                            >
                                <Trash size={14} />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
