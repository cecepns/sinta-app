import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ACTOR_KEY = 'sinta_actor_name';
const MENU_KEY = 'sinta_last_menu';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [actorName, setActorNameState] = useState(() => localStorage.getItem(ACTOR_KEY) || '');
  const [lastMenu, setLastMenuState] = useState(() => {
    try {
      const raw = localStorage.getItem(MENU_KEY);
      return raw ? JSON.parse(raw) : { id: null, name: '' };
    } catch {
      return { id: null, name: '' };
    }
  });

  useEffect(() => {
    if (actorName) localStorage.setItem(ACTOR_KEY, actorName);
    else localStorage.removeItem(ACTOR_KEY);
  }, [actorName]);

  const setActorName = useCallback((name) => {
    setActorNameState(String(name || '').trim());
  }, []);

  const setLastMenu = useCallback((id, name) => {
    const next = { id: id ? Number(id) : null, name: name || '' };
    setLastMenuState(next);
    if (next.id) localStorage.setItem(MENU_KEY, JSON.stringify(next));
    else localStorage.removeItem(MENU_KEY);
  }, []);

  const value = useMemo(
    () => ({
      actorName,
      setActorName,
      lastMenu,
      setLastMenu,
      requireActor: () => {
        if (!String(actorName || '').trim()) return false;
        return true;
      },
    }),
    [actorName, setActorName, lastMenu, setLastMenu]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp harus di dalam AppProvider');
  return ctx;
}
