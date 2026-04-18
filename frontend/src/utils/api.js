/**
 * Base URL API — default produksi. Override lokal: buat .env → VITE_API_URL=http://127.0.0.1:4000
 * Path contoh: https://api-inventory.isavralabel.com/inventory-sinta + /api/menus
 */
const DEFAULT_API_BASE = 'https://api-inventory.isavralabel.com/inventory-sinta';
const raw = import.meta.env.VITE_API_URL;
const resolved =
  typeof raw === 'string' && raw.trim() ? raw.trim() : DEFAULT_API_BASE;

export const API_BASE = resolved.replace(/\/$/, '');

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export function buildQuery(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
}

/** URL untuk menampilkan gambar dari server (path relatif dari API) */
export function mediaUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return apiUrl(relativePath.startsWith('/') ? relativePath : `/${relativePath}`);
}

export const endpoints = {
  health: () => '/api/health',
  menus: (query = {}) => `/api/menus${buildQuery(query)}`,
  menusCollection: '/api/menus',
  menu: (id) => `/api/menus/${id}`,
  subMenus: (menuId, query = {}) => `/api/menus/${menuId}/sub-menus${buildQuery(query)}`,
  subMenu: (id) => `/api/sub-menus/${id}`,
  items: (subMenuId, query = {}) => `/api/sub-menus/${subMenuId}/items${buildQuery(query)}`,
  item: (id) => `/api/items/${id}`,
  activities: (query = {}) => `/api/activities${buildQuery(query)}`,
};

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Respons tidak valid' };
  }
  return { ok: res.ok, status: res.status, data };
}

export async function apiJson(path, options = {}) {
  const { headers = {}, body, ...rest } = options;
  const isBodyString = typeof body === 'string';
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      ...(isBodyString || body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body instanceof FormData ? body : body !== undefined && !isBodyString ? JSON.stringify(body) : body,
  });
  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export async function apiForm(path, formData, method = 'POST') {
  const res = await fetch(apiUrl(path), { method, body: formData });
  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}
