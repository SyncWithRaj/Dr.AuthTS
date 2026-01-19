import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  requiredRole?: string;
}

const PrivateRoute = ({ requiredRole }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // 1. If not logged in -> Go to Login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 2. If role is required (e.g., ADMIN) and user doesn't have it -> Go to Dashboard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />; // Or an "Unauthorized" page
  }

  // 3. Authorized -> Render the page
  return <Outlet />;
};

export default PrivateRoute;