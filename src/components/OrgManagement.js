import React, { useEffect, useState } from 'react';
import {
    Alert, Badge, Button, Card, Container, Form,
    Modal, Spinner, Table,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { isAdmin, isOwner } from '../api/IsAdmin';
import { refreshUserOrg } from '../api/GetToken';
import { getOrgMembers, addOrgMember, updateMemberRole, removeOrgMember } from '../api/OrgApi';

const ROLE_LABELS = { owner: 'Владелец', admin: 'Администратор', user: 'Пользователь' };
const ASSIGNABLE_ROLES = ['user', 'admin'];

const OrgManagement = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isOwnerUser, setIsOwnerUser] = useState(false);

    const [showAdd, setShowAdd] = useState(false);
    const [addEmail, setAddEmail] = useState('');
    const [addRole, setAddRole] = useState('user');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState(null);

    const [roleLoading, setRoleLoading] = useState(null);
    const [removeLoading, setRemoveLoading] = useState(null);

    useEffect(() => {
        const init = async () => {
            await refreshUserOrg(navigate);
            const admin = isAdmin();
            const owner = isOwner();
            setIsAdminUser(admin);
            setIsOwnerUser(owner);
            if (!owner) { navigate('/chat'); return; }
            const data = await getOrgMembers(navigate);
            if (data) setMembers(data);
            setLoading(false);
        };
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddMember = async () => {
        if (!addEmail.trim()) return;
        setAddLoading(true);
        setAddError(null);
        try {
            await addOrgMember(addEmail.trim(), addRole, navigate);
            const data = await getOrgMembers(navigate);
            if (data) setMembers(data);
            setAddEmail('');
            setAddRole('user');
            setShowAdd(false);
        } catch (e) {
            setAddError(e.message);
        } finally {
            setAddLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setRoleLoading(userId);
        try {
            await updateMemberRole(userId, newRole, navigate);
            setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
        } catch (e) {
            setError(e.message);
        } finally {
            setRoleLoading(null);
        }
    };

    const handleRemove = async (userId, email) => {
        if (!window.confirm(`Удалить ${email} из организации?`)) return;
        setRemoveLoading(userId);
        try {
            await removeOrgMember(userId, navigate);
            setMembers(prev => prev.filter(m => m.user_id !== userId));
        } catch (e) {
            setError(e.message);
        } finally {
            setRemoveLoading(null);
        }
    };

    const orgName = localStorage.getItem('org_name') || '';

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column vh-100">
            <Navbar isAdmin={isAdminUser} isOwner={isOwnerUser} />
            <Container className="flex-grow-1 py-4">
                <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Организация: {orgName}</h4>
                        <Button variant="light" size="sm" onClick={() => setShowAdd(true)}>
                            + Добавить участника
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)} className="m-3">
                                {error}
                            </Alert>
                        )}
                        <Table hover responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th style={{ width: '140px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(m => (
                                    <tr key={m.user_id}>
                                        <td className="align-middle">{m.email}</td>
                                        <td className="align-middle">
                                            {m.role === 'owner' ? (
                                                <Badge bg="warning" text="dark">{ROLE_LABELS.owner}</Badge>
                                            ) : (
                                                <Form.Select
                                                    size="sm"
                                                    value={m.role}
                                                    style={{ width: '160px' }}
                                                    disabled={roleLoading === m.user_id}
                                                    onChange={e => handleRoleChange(m.user_id, e.target.value)}
                                                >
                                                    {ASSIGNABLE_ROLES.map(r => (
                                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                                    ))}
                                                </Form.Select>
                                            )}
                                        </td>
                                        <td className="align-middle text-end">
                                            {m.role !== 'owner' && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    disabled={removeLoading === m.user_id}
                                                    onClick={() => handleRemove(m.user_id, m.email)}
                                                >
                                                    {removeLoading === m.user_id ? (
                                                        <Spinner animation="border" size="sm" />
                                                    ) : 'Удалить'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showAdd} onHide={() => { setShowAdd(false); setAddError(null); setAddEmail(''); }}>
                <Modal.Header closeButton>
                    <Modal.Title>Добавить участника</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {addError && <Alert variant="danger">{addError}</Alert>}
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="user@example.com"
                            value={addEmail}
                            onChange={e => setAddEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Роль</Form.Label>
                        <Form.Select value={addRole} onChange={e => setAddRole(e.target.value)}>
                            {ASSIGNABLE_ROLES.map(r => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAdd(false)}>Отмена</Button>
                    <Button variant="primary" onClick={handleAddMember} disabled={addLoading || !addEmail.trim()}>
                        {addLoading ? <Spinner animation="border" size="sm" /> : 'Добавить'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OrgManagement;
