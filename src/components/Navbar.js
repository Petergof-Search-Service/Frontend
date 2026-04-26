import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { MoonFill, SunFill } from 'react-bootstrap-icons';

const Navbar = ({ isAdmin, isOwner }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const orgName = localStorage.getItem('org_name');
    const currentOrgId = localStorage.getItem('org_id');
    const orgList = JSON.parse(localStorage.getItem('org_list') || '[]');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('org_id');
        localStorage.removeItem('org_role');
        localStorage.removeItem('org_name');
        localStorage.removeItem('org_list');
        navigate('/login');
    };

    const handleOrgSwitch = (org) => {
        localStorage.setItem('org_id', String(org.id));
        localStorage.setItem('org_role', org.role);
        localStorage.setItem('org_name', org.name);
        navigate(0);
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
                        {isOwner && (
                            <LinkContainer to="/org">
                                <Nav.Link style={{padding: '0.75rem 1rem'}}>Организация</Nav.Link>
                            </LinkContainer>
                        )}
                    </Nav>
                    <Nav className="align-items-center gap-2">
                        {orgList.length > 1 ? (
                            <NavDropdown
                                title={orgName || 'Организация'}
                                id="org-switcher"
                                align="end"
                            >
                                {orgList.map(org => (
                                    <NavDropdown.Item
                                        key={org.id}
                                        onClick={() => handleOrgSwitch(org)}
                                        active={String(org.id) === currentOrgId}
                                    >
                                        {org.name}
                                    </NavDropdown.Item>
                                ))}
                            </NavDropdown>
                        ) : orgName ? (
                            <Badge bg="secondary" style={{fontSize: '0.9rem', padding: '0.4rem 0.7rem'}}>
                                {orgName}
                            </Badge>
                        ) : null}
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
