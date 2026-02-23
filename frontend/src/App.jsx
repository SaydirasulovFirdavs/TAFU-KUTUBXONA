import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Library from './pages/Library';
import Profile from './pages/Profile';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminUsers from './pages/admin/AdminUsers';
import BookReader from './pages/BookReader';
import MainLayout from './components/MainLayout';
import { Toaster } from 'react-hot-toast';
import './index.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;

  // Check role if required
  if (requiredRole && user) {
    // If requiredRole is array
    if (Array.isArray(requiredRole) && !requiredRole.includes(user.role)) {
      return <Navigate to="/" />;
    }
    // If requiredRole is string
    if (typeof requiredRole === 'string' && user.role !== requiredRole) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

// Public Route Component (redirect to home if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Books Route - Public */}
        <Route path="/books" element={<Books />} />

        {/* Book Detail Route - Public */}
        <Route path="/books/:id" element={<BookDetail />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />

        {/* PDF Reader Route - typically full screen, but can be in layout too or separate */}
        <Route
          path="/read/:id"
          element={
            <ProtectedRoute>
              <BookReader />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth Routes - Without Layout or with a minimal one */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Admin Routes - Has its own AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <AdminLayout>
              <AdminBooks />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#0f172a',
              borderRadius: '12px',
              border: '1px solid rgba(37, 99, 235, 0.1)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
