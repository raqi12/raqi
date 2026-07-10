import { Button } from './ui/Button';
import { SearchInput } from './ui/SearchInput';
import { TAB_LABELS } from '../i18n/ar';
import { tabFromPathname } from '../navigation/routes';
import { useLocation } from 'react-router-dom';

type TopBarProps = {
  title: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userEmail: string;
  onOpenMenu?: () => void;
};

export function TopBar({
  title,
  subtitle,
  search,
  onSearchChange,
  loading,
  onRefresh,
  theme,
  onToggleTheme,
  userEmail,
  onOpenMenu,
}: TopBarProps) {
  const location = useLocation();
  const currentTab = tabFromPathname(location.pathname);

  return (
    <header className="topbar">
      <div className="topbar__start">
        {onOpenMenu ? (
          <Button type="button" variant="ghost" className="topbar__menu" onClick={onOpenMenu}>
            القائمة
          </Button>
        ) : null}
        <div>
          <nav className="topbar__breadcrumb" aria-label="مسار الصفحة">
            <span>رقي</span>
            <span aria-hidden="true">/</span>
            <span>{TAB_LABELS[currentTab]}</span>
          </nav>
          <h1 className="topbar__title">{title}</h1>
          {subtitle ? <p className="topbar__subtitle">{subtitle}</p> : null}
        </div>
      </div>

      <div className="topbar__center">
        <SearchInput value={search} onChange={onSearchChange} placeholder="بحث في الصفحة الحالية..." />
      </div>

      <div className="topbar__end">
        <Button type="button" variant="ghost" onClick={onToggleTheme} aria-label="تبديل السمة">
          {theme === 'dark' ? 'فاتح' : 'داكن'}
        </Button>
        <Button type="button" variant="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'جاري التحديث...' : 'تحديث'}
        </Button>
        <div className="topbar__user" title={userEmail}>
          <span className="topbar__avatar" aria-hidden="true">
            {userEmail.charAt(0).toUpperCase()}
          </span>
          <span className="topbar__email">{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
