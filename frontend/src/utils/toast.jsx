import React from 'react';
import { toast } from 'react-toastify';

export function toastSuccess(message) {
  toast.success(message);
}

export function toastError(message) {
  toast.error(message);
}

export function toastInfo(message) {
  toast.info(message);
}

/**
 * Konfirmasi lewat react-toastify (wajib untuk aksi hapus/destruktif).
 * @param {string} message
 * @param {() => void | Promise<void>} onConfirm
 */
export function toastConfirm(message, onConfirm) {
  const id = toast(
    ({ closeToast }) => (
      <div className="flex flex-col gap-3 text-sm text-slate-800">
        <p className="font-medium leading-snug">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              closeToast?.();
              toast.dismiss(id);
            }}
          >
            Batal
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
            onClick={async () => {
              toast.dismiss(id);
              try {
                await onConfirm();
              } catch (e) {
                toast.error(e?.message || 'Aksi gagal');
              }
            }}
          >
            Ya, lanjutkan
          </button>
        </div>
      </div>
    ),
    { autoClose: false, closeOnClick: false, closeButton: false, draggable: false }
  );
}
