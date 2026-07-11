import { TAB_LABELS } from '../i18n/ar';
import { LuLogOut, LuPanelLeftClose, LuPanelLeftOpen, TAB_ICONS } from '../navigation/nav-icons';
import { ROUTE_PATHS, type SidebarTab } from '../navigation/routes';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export type { SidebarTab };

type NavGroup = {
  title: string;
  items: SidebarTab[];
};

const NAV_GROUPS: NavGroup[] = [
  { title: 'رئيسي', items: ['overview'] },
  { title: 'العمليات', items: ['customers', 'subscriptions', 'tasks', 'complaints'] },
  { title: 'الموارد', items: ['users', 'drivers', 'plans', 'bins', 'locations', 'routes'] },
  { title: 'المالية', items: ['payments', 'bank-account', 'deposit-requests'] },
];

type SidebarProps = {
  activeTab: SidebarTab;
  onNavigate: (path: string) => void;
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
  onNavigate,
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
          <div className="sidebar__brand-main">
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
          <Button
            type="button"
            variant="ghost"
            className="sidebar__toggle btn--icon"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'}
            title={collapsed ? 'توسيع' : 'طي'}
          >
            {collapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
          </Button>
        </div>

        <nav className="sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="sidebar__group">
              {!collapsed ? <p className="sidebar__group-title">{group.title}</p> : null}
              <ul>
                {group.items.map((tab) => {
                  const active = activeTab === tab;
                  const path = ROUTE_PATHS[tab];
                  const Icon = TAB_ICONS[tab];
                  const showBadge = tab === 'deposit-requests' && pendingDeposits > 0;

                  return (
                    <li key={tab}>
                      <a
                        href={path}
                        className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}
                        onClick={(event) => {
                          event.preventDefault();
                          onNavigate(path);
                        }}
                        title={TAB_LABELS[tab]}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="sidebar__icon" aria-hidden="true">
                          <Icon />
                        </span>
                        {!collapsed ? (
                          <>
                            <span className="sidebar__link-label">{TAB_LABELS[tab]}</span>
                            {showBadge ? <Badge tone="danger">{pendingDeposits}</Badge> : null}
                          </>
                        ) : showBadge ? (
                          <span className="sidebar__badge-dot" aria-label={`${pendingDeposits} طلب معلق`} />
                        ) : null}
                      </a>
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
              className={collapsed ? 'btn--icon sidebar__logout-btn' : 'sidebar__logout-btn'}
              onClick={onLogout}
              title="تسجيل الخروج"
            >
              {collapsed ? <LuLogOut /> : 'تسجيل الخروج'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
