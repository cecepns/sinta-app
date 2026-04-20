import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ImagePlus, Pencil, Send, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ActorModal } from '../components/ActorModal.jsx';
import { PaginationBar } from '../components/PaginationBar.jsx';
import { Fab } from '../components/Fab.jsx';
import { useApp } from '../context/AppContext.jsx';
import { apiForm, apiJson, endpoints, mediaUrl } from '../utils/api.js';
import { toastConfirm, toastError, toastSuccess } from '../utils/toast.jsx';

export function MenusPage() {
  const navigate = useNavigate();
  const { actorName, setLastMenu } = useApp();
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
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const resetImageInputs = () => {
    setFormFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiJson(endpoints.menus({ page, limit: 20, search }));
      setItems(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toastError(e.message || 'Gagal memuat menu');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

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
    resetImageInputs();
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormName(row.name);
    resetImageInputs();
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!guardActor()) return;
    const name = formName.trim();
    if (!name) {
      toastError('Nama menu wajib diisi.');
      return;
    }
    const fd = new FormData();
    fd.append('name', name);
    fd.append('actor_name', actorName);
    if (formFile) fd.append('image', formFile);
    try {
      if (editing) {
        await apiForm(endpoints.menu(editing.id), fd, 'PUT');
        toastSuccess('Menu berhasil diubah.');
      } else {
        await apiForm(endpoints.menusCollection, fd, 'POST');
        toastSuccess('Menu berhasil ditambahkan.');
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      toastError(e.message || 'Gagal menyimpan menu');
    }
  };

  const remove = (row) => {
    if (!guardActor()) return;
    toastConfirm(`Hapus menu "${row.name}" beserta sub menu dan alat di dalamnya?`, async () => {
      try {
        await apiJson(endpoints.menu(row.id), {
          method: 'DELETE',
          body: { actor_name: actorName },
        });
        toastSuccess('Menu dihapus.');
        await load();
      } catch (e) {
        toastError(e.message || 'Gagal menghapus');
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Menu"
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                className="relative aspect-[4/3] w-full bg-slate-100"
                onClick={() => {
                  setLastMenu(m.id, m.name);
                  navigate(`/menus/${m.id}/sub-menus`);
                }}
              >
                {m.image_url ? (
                  <img src={mediaUrl(m.image_url)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">Tanpa gambar</div>
                )}
              </button>
              <div className="flex flex-1 flex-col gap-2 p-2">
                <button
                  type="button"
                  className="text-left text-xs font-bold uppercase leading-snug text-slate-900 line-clamp-2"
                  onClick={() => {
                    setLastMenu(m.id, m.name);
                    navigate(`/menus/${m.id}/sub-menus`);
                  }}
                >
                  {m.name}
                </button>
                <div className="mt-auto flex justify-end gap-1 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Hapus"
                    onClick={() => remove(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-sinta-700"
                    aria-label="Ubah"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-sinta-700"
                    aria-label="Buka sub menu"
                    onClick={() => {
                      setLastMenu(m.id, m.name);
                      navigate(`/menus/${m.id}/sub-menus`);
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">Belum ada menu. Tambahkan dengan tombol +.</p>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />

      <Fab onClick={openCreate} />

      <ActorModal open={actorOpen} onClose={() => setActorOpen(false)} />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold">{editing ? 'Ubah menu' : 'Menu baru'}</h2>
            <label className="mb-2 block text-sm font-medium text-slate-700">Nama</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sinta-500 focus:ring-2"
            />
            <label className="mb-2 block text-sm font-medium text-slate-700">Gambar (opsional)</label>
            <div className="mb-4 rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Ambil dari kamera
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  Pilih dari galeri
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                className="sr-only"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                className="sr-only"
              />
              <p className="mt-2 text-xs text-slate-500">{formFile ? `File dipilih: ${formFile.name}` : 'Belum ada file dipilih.'}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setFormOpen(false);
                  resetImageInputs();
                }}
              >
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
