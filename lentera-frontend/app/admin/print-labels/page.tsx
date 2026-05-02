"use client";

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function PrintLabelsPage() {
  const router = useRouter();
  const toast = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.get('/assets');
        setAssets(res.data.data);
      } catch {
        toast.error("Gagal memuat data alat.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getAssetQRUrl = (code: string) => {
    return `${window.location.origin}/cek-alat?code=${encodeURIComponent(code)}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold">Memuat data alat...</p>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="p-6 h-screen flex flex-col overflow-hidden print:h-auto print:overflow-visible relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[var(--accent-secondary)]/5 via-transparent to-transparent pointer-events-none print-hidden" />
        <div className="flex items-center justify-between mb-6 print-hidden shrink-0 relative z-10">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </span>
            </Button>
            <h1 className="text-2xl font-extrabold mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
              Print Label QR Code
            </h1>
            <p className="text-sm text-slate-400">Cetak label QR untuk ditempel di setiap alat</p>
          </div>
          <Button variant="primary" size="lg" onClick={handlePrint}>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Labels
            </span>
          </Button>
        </div>

        <div ref={printRef} className="print-p-0 print-m-0 flex-1 overflow-y-auto pr-2 pb-10 print:overflow-visible print:pb-0 relative z-10">
          <div className="print-hidden mb-6">
            <p className="text-sm text-slate-500">Menampilkan {assets.length} label QR. Klik "Print Labels" untuk mencetak.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print-grid-cols-3 gap-4 print-gap-2">
            {assets.map(asset => (
              <div key={asset.id} className="border border-[var(--card-border)] rounded-xl p-4 text-center bg-white text-black print-border print-border-gray-300">
                <div className="bg-white inline-block p-2 rounded-lg mb-2">
                  <QRCodeCanvas
                    value={getAssetQRUrl(asset.code)}
                    size={120}
                    level={"M"}
                    includeMargin={false}
                  />
                </div>
                <div className="font-mono font-bold text-sm">{asset.code}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{asset.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
