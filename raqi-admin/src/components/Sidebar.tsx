import { TAB_LABELS } from '../i18n/ar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export type SidebarTab = keyof typeof TAB_LABELS;

type NavGroup = {
  title: string;
  items: SidebarTab[];
};

const NAV_GROUPS: NavGroup[] = [
  { title: 'رئيسي', items: ['overview'] },
  { title: 'العمليات', items: ['customers', 'subscriptions', 'tasks', 'complaints'] },
  { title: 'الموارد', items: ['users', 'drivers', 'plans', 'bins', 'areas', 'routes'] },
  { title: 'المالية', items: ['payments', 'bank-account', 'deposit-requests'] },
];

type SidebarProps = {
  activeTab: SidebarTab;
  onSelect: (tab: SidebarTab) => void;
  userEmail: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  pendingDeposits?: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({
  activeTab,
  onSelect,
  userEmail,
  collapsed,
  onToggleCollapse,
  onLogout,
  pendingDeposits = 0,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="إغلاق القائمة"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={[
          'sidebar',
          collapsed ? 'sidebar--collapsed' : '',
          mobileOpen ? 'sidebar--mobile-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="التنقل الرئيسي"
      >
        <div className="sidebar__brand">
          <div className="sidebar__mark" aria-hidden="true">
            ر
          </div>
          {!collapsed ? (
            <div className="sidebar__brand-text">
              <strong>رقي</strong>
              <span>لوحة الإدارة</span>
            </div>
          ) : null}
        </div>

        <nav className="sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="sidebar__group">
              {!collapsed ? <p className="sidebar__group-title">{group.title}</p> : null}
              <ul>
                {group.items.map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <li key={tab}>
                      <button
                        type="button"
                        className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}
                        onClick={() => onSelect(tab)}
                        title={TAB_LABELS[tab]}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="sidebar__indicator" aria-hidden="true" />
                        <span className="sidebar__link-label">{TAB_LABELS[tab]}</span>
                        {tab === 'deposit-requests' && pendingDeposits > 0 ? (
                          <Badge tone="danger">{pendingDeposits}</Badge>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          {!collapsed ? (
            <div className="sidebar__user">
              <span className="sidebar__user-avatar" aria-hidden="true">
                {userEmail.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="sidebar__user-email">{userEmail}</p>
                <p className="sidebar__user-role">مدير النظام</p>
              </div>
            </div>
          ) : null}
          <div className="sidebar__footer-actions">
            <Button
              type="button"
              variant="ghost"
              className="sidebar__collapse-btn"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'}
            >
              {collapsed ? '⟩' : '⟨'}
            </Button>
            <Button type="button" variant="ghost" onClick={onLogout}>
              {collapsed ? 'خروج' : 'تسجيل الخروج'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
