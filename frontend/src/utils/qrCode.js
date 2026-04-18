import QRCode from 'qrcode';

/**
 * Membuat data URL PNG kode QR untuk isi (biasanya URL).
 */
export async function urlToQrDataUrl(text, options = {}) {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    ...options,
  });
}

/**
 * Memicu unduh file PNG kode QR di browser.
 */
export async function downloadUrlAsQrPng(text, filename) {
  const dataUrl = await urlToQrDataUrl(text);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
