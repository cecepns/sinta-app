import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader.jsx';
import { ActorModal } from '../components/ActorModal.jsx';
import { PaginationBar } from '../components/PaginationBar.jsx';
import { apiJson, downloadDatabaseBackup, endpoints } from '../utils/api.js';
import { toastError, toastSuccess } from '../utils/toast.jsx';

const actionLabel = {
  create: 'Menambah',
  update: 'Mengubah',
  delete: 'Menghapus',
};

const entityLabel = {
  menu: 'Menu',
  sub_menu: 'Sub menu',
  item: 'Alat',
};

export function ActivitiesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actorOpen, setActorOpen] = useState(false);
  const [downloadingDb, setDownloadingDb] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiJson(endpoints.activities({ page, limit: 20, search }));
      setItems(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toastError(e.message || 'Gagal memuat aktivitas');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownloadDatabase = async () => {
    setDownloadingDb(true);
    try {
      await downloadDatabaseBackup();
      toastSuccess('Backup database berhasil diunduh.');
    } catch (e) {
      toastError(e.message || 'Gagal mengunduh backup database');
    } finally {
      setDownloadingDb(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Aktivitas"
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
        onDownloadDatabase={handleDownloadDatabase}
        downloadingDatabase={downloadingDb}
        onOpenActor={() => setActorOpen(true)}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{a.actor_name}</p>
                <time className="text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </div>
              <p className="mt-1 text-xs font-medium text-sinta-700">
                {actionLabel[a.action] || a.action} · {entityLabel[a.entity_type] || a.entity_type}
                {a.entity_id ? ` #${a.entity_id}` : ''}
              </p>
              <p className="mt-1 text-sm text-slate-600">{a.summary}</p>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />

      <ActorModal open={actorOpen} onClose={() => setActorOpen(false)} />
    </div>
  );
}
