import { NavLink } from 'react-router-dom';
import { Activity, LayoutGrid, LayoutList } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const cls = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-sinta-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export function DesktopNav() {
  const { lastMenu } = useApp();
  return (
    <div className="mx-auto hidden max-w-5xl items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 md:flex">
      <span className="mr-2 text-sm font-bold text-sinta-700">SINTA</span>
      <NavLink to="/menus" className={cls} end>
        <LayoutGrid className="h-4 w-4" />
        Menu
      </NavLink>
      {lastMenu?.id ? (
        <NavLink to={`/menus/${lastMenu.id}/sub-menus`} className={cls}>
          <LayoutList className="h-4 w-4" />
          Sub menu
        </NavLink>
      ) : null}
      <NavLink to="/activities" className={cls}>
        <Activity className="h-4 w-4" />
        Aktivitas
      </NavLink>
    </div>
  );
}
