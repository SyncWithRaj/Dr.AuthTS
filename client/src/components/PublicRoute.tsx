import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    // If logged in -> Redirect to Profile (or Dashboard)
    if (user) {
        return <Navigate to="/profile" replace />;
    }

    // Not logged in -> Render children (Login/Signup pages)
    return <Outlet />;
};

export default PublicRoute;
