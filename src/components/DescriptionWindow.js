import React from "react";
import {Button, Modal} from "react-bootstrap";
import {X} from "react-bootstrap-icons";
import {InfoCircle} from "react-bootstrap-icons";

const DescriptionWindow = ({onClose}) => {
    return (
        <Modal show={true} onHide={onClose} size="lg" centered>
            <Modal.Header className="bg-primary text-white">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <InfoCircle size={24} />
                    О приложении
                </Modal.Title>
                <Button
                    variant="link"
                    onClick={onClose}
                    className="text-white"
                    style={{marginLeft: 'auto', padding: 0}}
                >
                    <X size={24} />
                </Button>
            </Modal.Header>
            <Modal.Body className="p-4">
                <div className="mb-4">
                    <h5 className="fw-bold mb-3">Добро пожаловать!</h5>
                    <p className="mb-3">
                        Я приложение-помощник для изучения исторической литературы Петергофа. 
                        В чате вы можете выбирать индекс модели (которые заранее создал сотрудник музея) 
                        и задавать разные вопросы.
                    </p>
                    <p className="mb-3">
                        Я постараюсь ответить на ваш вопрос и указать название документа и страницу 
                        с информацией.
                    </p>
                </div>

                <div className="border-top pt-4">
                    <h5 className="fw-bold mb-3">Для сотрудников</h5>
                    <p className="mb-3">
                        Если вы сотрудник, то вам доступна функциональность создания индекса. 
                        На странице загрузки PDF вы можете загрузить ваш документ, и я начну его анализировать 
                        (это может занять довольно продолжительное время, около минуты на 10 страниц).
                    </p>
                    <p className="mb-0">
                        На странице создания индекса вы можете выбрать из уже загруженных документов те документы, 
                        на которых вы хотите осуществлять поиск. После нажатия на кнопку "Создать индекс" 
                        создастся и появится в чате в списке доступных индексов.
                    </p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onClose}>
                    Понятно
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DescriptionWindow;
