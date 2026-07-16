import { Button } from './ui/Button';
import { IconChevron, IconMenu, IconMoon, IconRefresh, IconSun } from './ui/Icons';
import { SearchInput } from './ui/SearchInput';
import { NotificationBell } from './NotificationBell';
import { TAB_LABELS } from '../i18n/ar';
import { getNavGroupLabel, tabFromPathname } from '../navigation/routes';
import { useLocation } from 'react-router-dom';

type TopBarProps = {
  title: string;
  lastSync: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userEmail: string;
  accessToken: string;
  onOpenMenu?: () => void;
};

export function TopBar({
  title,
  lastSync,
  search,
  onSearchChange,
  loading,
  onRefresh,
  theme,
  onToggleTheme,
  userEmail,
  accessToken,
  onOpenMenu,
}: TopBarProps) {
  const location = useLocation();
  const currentTab = tabFromPathname(location.pathname);
  const sectionLabel = getNavGroupLabel(currentTab);
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__start">
        {onOpenMenu ? (
          <Button
            type="button"
            variant="ghost"
            className="topbar__menu btn--icon"
            onClick={onOpenMenu}
            aria-label="فتح القائمة"
          >
            <IconMenu />
          </Button>
        ) : null}

        <div className="topbar__heading">
          <nav className="topbar__breadcrumb" aria-label="مسار الصفحة">
            <span className="topbar__breadcrumb-brand">رقي</span>
            <IconChevron className="topbar__breadcrumb-sep" />
            <span>{sectionLabel}</span>
            <IconChevron className="topbar__breadcrumb-sep" />
            <span className="topbar__breadcrumb-current">{TAB_LABELS[currentTab]}</span>
          </nav>

          <div className="topbar__title-row">
            <h1 className="topbar__title">{title}</h1>
            <div
              className={['topbar__sync', loading ? 'topbar__sync--active' : ''].filter(Boolean).join(' ')}
              title={lastSync ? `آخر مزامنة ${lastSync}` : 'اضغط زر التحديث لمزامنة البيانات'}
            >
              <span className="topbar__sync-dot" aria-hidden="true" />
              <span className="topbar__sync-text">
                {loading ? 'جاري المزامنة...' : lastSync ? `آخر مزامنة ${lastSync}` : 'في انتظار المزامنة'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="topbar__center">
        <SearchInput value={search} onChange={onSearchChange} placeholder="بحث في الصفحة الحالية..." />
      </div>

      <div className="topbar__end">
        <div className="topbar__actions" role="toolbar" aria-label="إجراءات الشريط العلوي">
          <NotificationBell accessToken={accessToken} />

          <Button
            type="button"
            variant="ghost"
            className="btn--icon"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            title={theme === 'dark' ? 'وضع فاتح' : 'وضع داكن'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className={['btn--icon', loading ? 'btn--icon-spin' : ''].filter(Boolean).join(' ')}
            onClick={onRefresh}
            disabled={loading}
            aria-label="تحديث البيانات"
            title="تحديث"
          >
            <IconRefresh />
          </Button>
        </div>

        <div className="topbar__divider" aria-hidden="true" />

        <div className="topbar__user" title={userEmail}>
          <span className="topbar__avatar" aria-hidden="true">
            {userInitial}
          </span>
          <div className="topbar__user-meta">
            <span className="topbar__user-role">مدير</span>
            <span className="topbar__email">{userEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
