import { Plus } from 'lucide-react';

export function Fab({ onClick, label = 'Tambah' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sinta-600 text-white shadow-lg hover:bg-sinta-700 md:bottom-8 md:right-8"
    >
      <Plus className="h-7 w-7" />
    </button>
  );
}
