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
 * Halaman daftar alat untuk satu sub menu (cocok untuk kode QR per baris).
 * @param {string|number} subMenuId
 * @param {string|number} [parentMenuId] — untuk query ?menuId= (tombol kembali saat buka dari pindai QR)
 */
export function getSubMenuItemsPageUrl(subMenuId, parentMenuId) {
  const base = getAppBaseUrl();
  if (!base || !subMenuId) return '';
  const path = `${base}/sub-menus/${String(subMenuId)}/items`;
  if (parentMenuId != null && String(parentMenuId) !== '') {
    return `${path}?menuId=${encodeURIComponent(String(parentMenuId))}`;
  }
  return path;
}
