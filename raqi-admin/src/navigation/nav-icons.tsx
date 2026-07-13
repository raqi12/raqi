import type { IconType } from 'react-icons';
import {
  LuArchive,
  LuBanknote,
  LuClipboardList,
  LuLandmark,
  LuLayoutDashboard,
  LuLogOut,
  LuMap,
  LuMapPinned,
  LuMessageSquare,
  LuMessageSquareWarning,
  LuLifeBuoy,
  LuPackage,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuRepeat,
  LuTruck,
  LuUserCog,
  LuUsers,
  LuWallet,
} from 'react-icons/lu';
import type { SidebarTab } from './routes';

export const TAB_ICONS: Record<SidebarTab, IconType> = {
  overview: LuLayoutDashboard,
  customers: LuUsers,
  subscriptions: LuRepeat,
  tasks: LuClipboardList,
  complaints: LuMessageSquareWarning,
  tickets: LuMessageSquare,
  support: LuLifeBuoy,
  users: LuUserCog,
  drivers: LuTruck,
  plans: LuPackage,
  bins: LuArchive,
  locations: LuMapPinned,
  routes: LuMap,
  payments: LuBanknote,
  'bank-account': LuLandmark,
  'deposit-requests': LuWallet,
};

export { LuLogOut, LuPanelLeftClose, LuPanelLeftOpen };
