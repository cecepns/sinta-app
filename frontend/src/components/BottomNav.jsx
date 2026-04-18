import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutGrid, LayoutList } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { toastError } from '../utils/toast.jsx';

const linkClass = ({ isActive }) =>
  `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium ${
    isActive ? 'text-sinta-600 border-t-2 border-sinta-600 bg-slate-50' : 'text-slate-500 border-t-2 border-transparent'
  }`;

export function BottomNav() {
  const navigate = useNavigate();
  const { lastMenu } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
      <NavLink to="/menus" className={linkClass} end>
        <LayoutGrid className="h-5 w-5" />
        Menu
      </NavLink>
      <button
        type="button"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium ${
          lastMenu?.id ? 'text-slate-600' : 'text-slate-400'
        } border-t-2 border-transparent`}
        onClick={() => {
          if (!lastMenu?.id) {
            toastError('Pilih menu terlebih dahulu dari tab Menu.');
            return;
          }
          navigate(`/menus/${lastMenu.id}/sub-menus`);
        }}
      >
        <LayoutList className="h-5 w-5" />
        <span className="line-clamp-2 max-w-[9rem] text-center leading-tight">
          {lastMenu?.id ? `Sub: ${lastMenu.name || 'Menu'}` : 'Sub menu'}
        </span>
      </button>
      <NavLink to="/activities" className={linkClass}>
        <Activity className="h-5 w-5" />
        Aktivitas
      </NavLink>
    </nav>
  );
}
