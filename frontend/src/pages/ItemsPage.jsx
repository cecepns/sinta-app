import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ActorModal } from '../components/ActorModal.jsx';
import { PaginationBar } from '../components/PaginationBar.jsx';
import { Fab } from '../components/Fab.jsx';
import { useApp } from '../context/AppContext.jsx';
import { apiJson, endpoints } from '../utils/api.js';
import { toastConfirm, toastError, toastSuccess } from '../utils/toast.jsx';

export function ItemsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { actorName } = useApp();
  const sid = Number(params.subMenuId) || 0;
  const searchMenuId = new URLSearchParams(location.search).get('menuId');
  const menuIdParam = params.menuId;
  const menuIdFromPath =
    menuIdParam != null && menuIdParam !== '' ? Number(menuIdParam) : undefined;
  const subMenuName = location.state?.subMenuName || 'Alat medis';
  const menuId =
    menuIdFromPath != null && !Number.isNaN(menuIdFromPath)
      ? menuIdFromPath
      : location.state?.menuId != null
        ? Number(location.state.menuId)
        : searchMenuId
          ? Number(searchMenuId)
          : undefined;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actorOpen, setActorOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('0');

  const load = useCallback(async () => {
    if (!sid) return;
    setLoading(true);
    try {
      const res = await apiJson(endpoints.items(sid, { page, limit: 20, search }));
      setItems(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toastError(e.message || 'Gagal memuat alat');
    } finally {
      setLoading(false);
    }
  }, [sid, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const guardActor = () => {
    if (!String(actorName || '').trim()) {
      toastError('Atur nama petugas lewat ikon profil terlebih dahulu.');
      setActorOpen(true);
      return false;
    }
    return true;
  };

  const goBack = () => {
    if (menuId) navigate(`/menus/${menuId}/sub-menus`);
    else navigate(-1);
  };

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormQty('0');
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormName(row.name);
    setFormQty(String(row.quantity ?? 0));
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!guardActor() || !sid) return;
    const name = formName.trim();
    if (!name) {
      toastError('Nama alat wajib diisi.');
      return;
    }
    const quantity = Math.max(0, parseInt(String(formQty), 10) || 0);
    try {
      if (editing) {
        await apiJson(endpoints.item(editing.id), {
          method: 'PUT',
          body: { name, quantity, actor_name: actorName },
        });
        toastSuccess('Alat berhasil diubah.');
      } else {
        await apiJson(`/api/sub-menus/${sid}/items`, {
          method: 'POST',
          body: { name, quantity, actor_name: actorName },
        });
        toastSuccess('Alat berhasil ditambahkan.');
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      toastError(e.message || 'Gagal menyimpan');
    }
  };

  const remove = (row) => {
    if (!guardActor()) return;
    toastConfirm(`Hapus alat "${row.name}"?`, async () => {
      try {
        await apiJson(endpoints.item(row.id), {
          method: 'DELETE',
          body: { actor_name: actorName },
        });
        toastSuccess('Alat dihapus.');
        await load();
      } catch (e) {
        toastError(e.message || 'Gagal menghapus');
      }
    });
  };

  return (
    <div>
      <PageHeader
        title={subMenuName}
        onBack={goBack}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        searchOpen={searchOpen}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => {
          setPage(1);
          setSearch(searchInput.trim());
        }}
        onRefresh={load}
        onOpenActor={() => setActorOpen(true)}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase leading-snug text-slate-900 line-clamp-2">{it.name}</p>
                <p className="mt-1 text-xs text-slate-500">Jumlah: {it.quantity}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus"
                  onClick={() => remove(it)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => openEdit(it)}>
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">Belum ada alat pada sub menu ini.</p>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />

      <Fab onClick={openCreate} />

      <ActorModal open={actorOpen} onClose={() => setActorOpen(false)} />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold">{editing ? 'Ubah alat' : 'Alat baru'}</h2>
            <label className="mb-2 block text-sm font-medium text-slate-700">Nama alat</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sinta-500 focus:ring-2"
            />
            <label className="mb-2 block text-sm font-medium text-slate-700">Jumlah</label>
            <input
              type="number"
              min={0}
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
              inputMode="numeric"
              className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sinta-500 focus:ring-2"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" onClick={() => setFormOpen(false)}>
                Batal
              </button>
              <button type="button" className="rounded-lg bg-sinta-600 px-4 py-2 text-sm font-medium text-white hover:bg-sinta-700" onClick={submitForm}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
