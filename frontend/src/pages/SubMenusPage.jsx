import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, QrCode, Send, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ActorModal } from '../components/ActorModal.jsx';
import { PaginationBar } from '../components/PaginationBar.jsx';
import { Fab } from '../components/Fab.jsx';
import { useApp } from '../context/AppContext.jsx';
import { apiForm, apiJson, endpoints, mediaUrl } from '../utils/api.js';
import { getSubMenuItemsPageUrl } from '../utils/appUrl.js';
import { downloadUrlAsQrPng } from '../utils/qrCode.js';
import { toastConfirm, toastError, toastSuccess } from '../utils/toast.jsx';

export function SubMenusPage() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const { actorName, lastMenu, setLastMenu } = useApp();
  const mid = Number(menuId);

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
  const [formFile, setFormFile] = useState(null);

  useEffect(() => {
    if (!mid) return;
    if (lastMenu?.id !== mid) setLastMenu(mid, `Menu #${mid}`);
  }, [mid, lastMenu?.id, setLastMenu]);

  const titleMenu = lastMenu?.id === mid && lastMenu.name ? lastMenu.name : `Menu #${menuId}`;

  const [qrRowId, setQrRowId] = useState(null);
  const downloadSubMenuQr = async (s) => {
    const href = getSubMenuItemsPageUrl(s.id, mid);
    if (!href) {
      toastError('Tidak dapat membangun URL.');
      return;
    }
    setQrRowId(s.id);
    try {
      await downloadUrlAsQrPng(href, `sinta-qr-sm-${s.id}.png`);
      toastSuccess('Kode QR diunduh.');
    } catch (e) {
      toastError(e?.message || 'Gagal membuat kode QR');
    } finally {
      setQrRowId(null);
    }
  };

  const load = useCallback(async () => {
    if (!mid) return;
    setLoading(true);
    try {
      const res = await apiJson(endpoints.subMenus(mid, { page, limit: 20, search }));
      setItems(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toastError(e.message || 'Gagal memuat sub menu');
    } finally {
      setLoading(false);
    }
  }, [mid, page, search]);

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

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormFile(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormName(row.name);
    setFormFile(null);
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!guardActor() || !mid) return;
    const name = formName.trim();
    if (!name) {
      toastError('Nama sub menu wajib diisi.');
      return;
    }
    const fd = new FormData();
    fd.append('name', name);
    fd.append('actor_name', actorName);
    if (formFile) fd.append('image', formFile);
    try {
      if (editing) {
        await apiForm(endpoints.subMenu(editing.id), fd, 'PUT');
        toastSuccess('Sub menu berhasil diubah.');
      } else {
        await apiForm(`/api/menus/${mid}/sub-menus`, fd, 'POST');
        toastSuccess('Sub menu berhasil ditambahkan.');
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      toastError(e.message || 'Gagal menyimpan');
    }
  };

  const remove = (row) => {
    if (!guardActor()) return;
    toastConfirm(`Hapus sub menu "${row.name}" beserta seluruh alat di dalamnya?`, async () => {
      try {
        await apiJson(endpoints.subMenu(row.id), {
          method: 'DELETE',
          body: { actor_name: actorName },
        });
        toastSuccess('Sub menu dihapus.');
        await load();
      } catch (e) {
        toastError(e.message || 'Gagal menghapus');
      }
    });
  };

  return (
    <div>
      <PageHeader
        title={`Sub menu — ${titleMenu}`}
        onBack={() => navigate('/menus')}
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
          {items.map((s) => (
            <li key={s.id} className="flex items-stretch gap-3 p-3">
              <button
                type="button"
                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                onClick={() =>
                  navigate(`/sub-menus/${s.id}/items`, { state: { subMenuName: s.name, menuId: mid } })
                }
              >
                {s.image_url ? (
                  <img src={mediaUrl(s.image_url)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-slate-400">N/A</div>
                )}
              </button>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <button
                  type="button"
                  className="text-left text-sm font-bold uppercase leading-snug text-slate-900 line-clamp-2"
                  onClick={() =>
                    navigate(`/sub-menus/${s.id}/items`, { state: { subMenuName: s.name, menuId: mid } })
                  }
                >
                  {s.name}
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 self-center">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus"
                  onClick={() => remove(s)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                  aria-label="Unduh kode QR"
                  disabled={qrRowId === s.id}
                  onClick={() => downloadSubMenuQr(s)}
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Buka alat"
                  onClick={() =>
                    navigate(`/sub-menus/${s.id}/items`, { state: { subMenuName: s.name, menuId: mid } })
                  }
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">Belum ada sub menu.</p>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />

      <Fab onClick={openCreate} />

      <ActorModal open={actorOpen} onClose={() => setActorOpen(false)} />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold">{editing ? 'Ubah sub menu' : 'Sub menu baru'}</h2>
            <label className="mb-2 block text-sm font-medium text-slate-700">Nama</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sinta-500 focus:ring-2"
            />
            <label className="mb-2 block text-sm font-medium text-slate-700">Gambar (opsional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFormFile(e.target.files?.[0] || null)} className="mb-4 w-full text-sm" />
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
