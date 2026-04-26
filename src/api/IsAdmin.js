export const isAdmin = () => {
    const role = localStorage.getItem('org_role');
    return role === 'admin' || role === 'owner';
};

export const isOwner = () => {
    return localStorage.getItem('org_role') === 'owner';
};
