import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { SearchProvider } from '../contexts/SearchContext';
import { useAdmin } from '../contexts/AdminContext';
import { useTheme } from '../hooks/useTheme';
import { TAB_LABELS } from '../i18n/ar';
import { tabFromPathname } from '../navigation/routes';
import { AdminPageRoutes } from '../pages/admin/AdminPageRoutes';

type AdminLayoutProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  mobileNavOpen: boolean;
  onOpenMobileNav: () => void;
  onCloseMobileNav: () => void;
};

export function AdminLayout({
  sidebarCollapsed,
  onToggleSidebar,
  mobileNavOpen,
  onOpenMobileNav,
  onCloseMobileNav,
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const {
    session,
    loading,
    error,
    toast,
    lastSync,
    searchQuery,
    setSearchQuery,
    setToast,
    loadAll,
    logout,
    pendingDeposits,
  } = useAdmin();

  const activeTab = tabFromPathname(location.pathname);

  return (
    <SearchProvider query={searchQuery} setQuery={setSearchQuery}>
      <div className="app-shell">
        <Sidebar
          activeTab={activeTab}
          onNavigate={(path) => {
            navigate(path);
            setSearchQuery('');
            if (window.innerWidth <= 900) {
              onCloseMobileNav();
            }
          }}
          userEmail={session.user.email}
          pendingDeposits={pendingDeposits}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          onLogout={logout}
          mobileOpen={mobileNavOpen}
          onCloseMobile={onCloseMobileNav}
        />

        <div className="main-area">
          <TopBar
            title={TAB_LABELS[activeTab]}
            lastSync={lastSync}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            loading={loading}
            onRefresh={() => void loadAll()}
            theme={theme}
            onToggleTheme={toggleTheme}
            userEmail={session.user.email}
            onOpenMenu={onOpenMobileNav}
          />

          <main className="content">
            {error ? <p className="error">{error}</p> : null}

            <div className="page-stack">
              <AdminPageRoutes />
            </div>

            <Toast message={toast?.message ?? null} type={toast?.type} onClose={() => setToast(null)} />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
