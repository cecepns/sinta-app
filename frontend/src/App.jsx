import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { MenusPage } from './pages/MenusPage.jsx';
import { SubMenusPage } from './pages/SubMenusPage.jsx';
import { ItemsPage } from './pages/ItemsPage.jsx';
import { ActivitiesPage } from './pages/ActivitiesPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/menus" replace />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/menus/:menuId/sub-menus" element={<SubMenusPage />} />
        <Route path="/sub-menus/:subMenuId/items" element={<ItemsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="*" element={<Navigate to="/menus" replace />} />
      </Route>
    </Routes>
  );
}
