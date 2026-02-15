import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { MoonFill, SunFill } from 'react-bootstrap-icons';

const Navbar = ({ isAdmin }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <BootstrapNavbar bg="light" expand="lg" className="border-bottom shadow-sm" style={{minHeight: '70px', fontSize: '1.1rem'}}>
            <Container fluid>
                <BootstrapNavbar.Brand className="fw-bold text-primary" style={{fontSize: '1.4rem'}}>
                    Научный ассистент
                </BootstrapNavbar.Brand>
                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto" variant="tabs" style={{fontSize: '1.05rem'}}>
                        <LinkContainer to="/chat">
                            <Nav.Link style={{padding: '0.75rem 1rem'}}>Чат</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/settings">
                            <Nav.Link style={{padding: '0.75rem 1rem'}}>Настройки</Nav.Link>
                        </LinkContainer>
                        {isAdmin && (
                            <>
                                <LinkContainer to="/file">
                                    <Nav.Link style={{padding: '0.75rem 1rem'}}>Добавить файл</Nav.Link>
                                </LinkContainer>
                                <LinkContainer to="/create_index">
                                    <Nav.Link style={{padding: '0.75rem 1rem'}}>Создать индекс</Nav.Link>
                                </LinkContainer>
                            </>
                        )}
                    </Nav>
                    <Nav className="align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            onClick={toggleTheme}
                            className="d-flex align-items-center justify-content-center"
                            style={{width: '40px', height: '40px', padding: 0}}
                            title={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
                        >
                            {theme === 'light' ? <MoonFill size={20} /> : <SunFill size={20} />}
                        </Button>
                        <Nav.Link onClick={handleLogout} className="text-danger" style={{padding: '0.75rem 1rem', fontSize: '1.05rem'}}>
                            Выйти
                        </Nav.Link>
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
};

export default Navbar;

