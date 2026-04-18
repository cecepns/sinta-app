import {
  ArrowLeft,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';

export function PageHeader({
  title,
  onBack,
  searchOpen,
  onToggleSearch,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  onOpenActor,
}) {
  return (
    <header className="sticky top-0 z-30 -mx-3 mb-3 border-b border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:rounded-b-xl">
      <div className="flex items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-9" />
        )}
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold tracking-tight text-slate-900 md:text-lg">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className={`rounded-lg p-2 ${searchOpen ? 'bg-sinta-50 text-sinta-700' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={onToggleSearch}
            aria-label="Cari"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onRefresh}
            aria-label="Muat ulang"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onOpenActor}
            aria-label="Nama petugas"
          >
            <UserRound className="h-5 w-5" />
          </button>
        </div>
      </div>
      {searchOpen && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
        >
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sinta-500 focus:ring-2"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-sinta-600 px-3 py-2 text-sm font-medium text-white hover:bg-sinta-700"
          >
            Cari
          </button>
        </form>
      )}
    </header>
  );
}
