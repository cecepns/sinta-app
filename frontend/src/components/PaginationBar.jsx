import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PaginationBar({ page, totalPages, onPage, className = '' }) {
  if (totalPages <= 1) return null;
  return (
    <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Sebelumnya
      </button>
      <span className="text-sm text-slate-600">
        Halaman {page} dari {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-40"
      >
        Berikutnya
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
