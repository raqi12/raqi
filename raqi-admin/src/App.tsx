import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { login, loadStoredSession, storeSession } from './api/auth';
import { setRefreshHandler, setSessionTokens } from './api/http';
import { AdminProvider } from './contexts/AdminContext';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { formatApiError } from './i18n/ar';
import type { Session } from './types';

function ProtectedAdminApp({
  session,
  onSessionChange,
}: {
  session: Session;
  onSessionChange: (session: Session | null) => void;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setSidebarCollapsed(true);
      setMobileNavOpen(false);
    }
  }, []);

  if (session.user.role !== 'admin') {
    return (
      <main className="container">
        <section className="panel access-denied">
          <h2>الوصول مرفوض</h2>
          <p>هذه اللوحة مخصصة لحسابات المدير فقط.</p>
          <button type="button" onClick={() => onSessionChange(null)}>
            تسجيل الخروج
          </button>
        </section>
      </main>
    );
  }

  return (
    <AdminProvider session={session} onSessionChange={onSessionChange}>
      <AdminLayout
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        mobileNavOpen={mobileNavOpen}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        onCloseMobileNav={() => setMobileNavOpen(false)}
      />
    </AdminProvider>
  );
}

function LoginRoute({
  onSessionChange,
}: {
  onSessionChange: (session: Session | null) => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@raqi.local');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      const role = res.data.user.role;
      if (role !== 'admin' && role !== 'manager' && role !== 'supervisor') {
        throw new Error('هذا الحساب غير مصرح له بدخول لوحة الإدارة');
      }
      onSessionChange(res.data);
      storeSession(res.data);
      setSessionTokens(res.data.accessToken, res.data.refreshToken);
      navigate('/overview', { replace: true });
    } catch (e) {
      setError(formatApiError(e instanceof Error ? e.message : 'فشل تسجيل الدخول'));
      onSessionChange(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginPage
      email={email}
      password={password}
      loading={loading}
      error={error}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
    />
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(() => loadStoredSession());

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    storeSession(next);
    setSessionTokens(next?.accessToken ?? null, next?.refreshToken ?? null);
    if (!next) {
      setRefreshHandler(null);
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute onSessionChange={applySession} />} />
      <Route
        path="/*"
        element={
          session ? (
            <ProtectedAdminApp session={session} onSessionChange={applySession} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
