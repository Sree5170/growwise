import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../feedback/Feedback.jsx';
import ParentLayout from './ParentLayout.jsx';
import ChildLayout from './ChildLayout.jsx';
import { ChildrenProvider } from '../../context/ChildrenContext.jsx';

export const Splash = () => <div className="grid min-h-screen place-items-center"><Spinner label="Loading GrowWise" /></div>;

// require: 'parent' | 'child' | 'any'. Wrong-mode users are redirected to their own home.
export default function ProtectedRoute({ require = 'any', withLayout = true }) {
  const { user, mode, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (require === 'parent' && mode !== 'parent') return <Navigate to="/child/dashboard" replace />;
  if (require === 'child' && mode !== 'child') return <Navigate to="/parent/dashboard" replace />;
  const Layout = mode === 'child' ? ChildLayout : ParentLayout;
  return withLayout ? <Layout /> : <Outlet />;
}
export { ChildrenProvider };
