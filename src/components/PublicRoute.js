import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem("access_token") && localStorage.getItem("refresh_token");

    if (isAuthenticated) {
        return <Navigate to="/chat" replace />;
    }

    return children;
};

export default PublicRoute;
