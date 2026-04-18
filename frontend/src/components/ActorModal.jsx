import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { toastSuccess } from '../utils/toast.jsx';

export function ActorModal({ open, onClose }) {
  const { actorName, setActorName } = useApp();
  const [val, setVal] = useState(actorName);

  useEffect(() => {
    if (open) setVal(actorName);
  }, [open, actorName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Nama petugas</h2>
          <button type="button" className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          Nama ini dicatat pada setiap aktivitas tambah, ubah, atau hapus inventori.
        </p>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Contoh: Dr. Sinta / CSSD"
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sinta-500 focus:ring-2"
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" onClick={onClose}>
            Tutup
          </button>
          <button
            type="button"
            className="rounded-lg bg-sinta-600 px-4 py-2 text-sm font-medium text-white hover:bg-sinta-700"
            onClick={() => {
              setActorName(val);
              toastSuccess('Nama petugas disimpan.');
              onClose();
            }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
