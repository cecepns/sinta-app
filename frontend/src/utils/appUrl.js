/**
 * Host / origin aplikasi untuk tautan deep-link (kode QR, bagikan).
 * Prioritas: VITE_APP_BASE_URL → window.location.origin (saat jalan di browser)
 */
export function getAppBaseUrl() {
  const fromEnv = import.meta.env.VITE_APP_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/**
 * Tautan halaman daftar sub menu untuk menu tertentu (cocok untuk kode QR).
 * Contoh: https://app.com/menus/1/sub-menus
 */
export function getSubMenusListUrl(menuId) {
  const base = getAppBaseUrl();
  if (!base || !menuId) return '';
  return `${base}/menus/${String(menuId)}/sub-menus`;
}

/**
 * URL halaman detail alat: daftar alat suatu sub menu.
 * Dengan parent: /menus/1/sub-menus/1/items (disarankan, termasuk kode QR).
 * Tanpa parent: /sub-menus/1/items
 */
export function getSubMenuItemsPageUrl(subMenuId, parentMenuId) {
  const base = getAppBaseUrl();
  if (!base || !subMenuId) return '';
  if (parentMenuId != null && String(parentMenuId) !== '') {
    return `${base}/menus/${String(parentMenuId)}/sub-menus/${String(subMenuId)}/items`;
  }
  return `${base}/sub-menus/${String(subMenuId)}/items`;
}
