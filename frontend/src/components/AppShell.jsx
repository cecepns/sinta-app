import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.jsx';
import { DesktopNav } from './DesktopNav.jsx';
import bgImage from '../assets/bg.jpeg';

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <DesktopNav />
      <header className="shrink-0 border-b border-slate-200 bg-white md:hidden">
        <div className="mx-auto max-w-3xl px-3 py-2.5 text-center">
          <span className="text-base font-bold tracking-tight text-sinta-700">SINTA</span>
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 pb-24 pt-2 md:max-w-5xl md:pb-6">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})`, opacity: 0.15 }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
