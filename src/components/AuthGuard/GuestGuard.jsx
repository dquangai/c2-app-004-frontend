import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth/useAuth';

export const GuestGuard = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};
