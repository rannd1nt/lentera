"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function CekAlatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCode = searchParams.get('code');

  const [inputCode, setInputCode] = useState('');
  const [scanData, setScanData] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    if (urlCode) {
      setInputCode(urlCode);
      fetchScanData(urlCode);
    }
  }, [urlCode]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [resAssets, resCats] = await Promise.all([api.get('/assets'), api.get('/categories')]);
        setAssets(resAssets.data.data);
        setCategories(resCats.data.data);
      } catch (err) {
        console.error("Gagal memuat katalog", err);
      } finally {
        setTableLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const fetchScanData = async (codeToSearch: string) => {
    if (!codeToSearch) return;
    setScanLoading(true);
    setScanError('');
    setScanData(null);

    try {
      const res = await api.get(`/assets/scan/${codeToSearch}`);
      setScanData(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) setScanError('Alat tidak ditemukan di sistem Lentera.');
      else setScanError('Gagal terhubung ke server.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/cek-alat?code=${inputCode}`);
    fetchScanData(inputCode);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge variant="success">Tersedia</Badge>;
      case 'borrowed': return <Badge variant="warning">Dipinjam</Badge>;
      case 'maintenance': return <Badge variant="danger">Maintenance</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER + SCAN RESULT */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--accent-secondary)]/15 via-transparent to-transparent" />

        <div className="relative z-10 pt-12 pb-8 px-6 flex flex-col items-center">

          <form onSubmit={handleManualSearch} className="w-full max-w-md flex gap-2 animate-lentera-slide-up">
            <Input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Masukkan Kode Alat (Cth: INV-01)"
              variant="mono"
              className="flex-1"
            />
            <Button type="submit" size="md">Cari</Button>
          </form>

          {scanLoading && (
            <div className="mt-6 flex items-center gap-3 text-[var(--accent-secondary)] animate-lentera-fade-in">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-sm">Mencari Data...</span>
            </div>
          )}

          {scanError && (
            <div className="mt-6 w-full max-w-md p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center animate-lentera-fade-in">
              <h3 className="font-semibold text-red-400 text-sm">{scanError}</h3>
            </div>
          )}

          {scanData && !scanLoading && (
            <Card className="mt-6 w-full max-w-md overflow-hidden animate-lentera-slide-up">
              <div className="p-5 bg-slate-800/50 border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--accent-secondary)] tracking-widest uppercase truncate">{scanData.category}</div>
                    <h2 className="text-lg font-black mt-1 truncate">{scanData.name}</h2>
                  </div>
                  <span className="inline-block font-mono text-xs tracking-widest px-3 py-1 rounded-full bg-slate-700/80 text-slate-300 shrink-0">{scanData.code}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-center mb-4">{statusBadge(scanData.status)}</div>
                {scanData.status === 'borrowed' && scanData.borrower && (
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-sm">
                    <h3 className="font-bold text-amber-400 mb-3 border-b border-amber-500/20 pb-2">Sedang Dipinjam Oleh:</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500">Nama</span><span className="font-semibold">{scanData.borrower.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Kelas</span><span className="font-semibold">{scanData.borrower.class}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Matkul</span><span className="font-semibold">{scanData.borrower.subject}</span></div>
                      <div className="flex justify-between pt-2 border-t border-amber-500/20 mt-2"><span className="text-slate-500 text-xs">Sejak</span><span className="font-semibold text-xs font-mono">{scanData.borrower.borrowed_at}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* KATALOG */}
      <div className="flex-1 px-6 pb-8 max-w-6xl w-full mx-auto">
        <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Katalog Alat Laboratorium</h2>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={selectedCat === null ? "primary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCat(null)}
            className="whitespace-nowrap"
          >
            Semua Aset
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCat === cat.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCat(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.name} <span className="ml-1 opacity-70">({cat.assets_count})</span>
            </Button>
          ))}
        </div>

        {tableLoading ? (
          <Card className="p-10 text-center animate-lentera-fade-in">
            <div className="inline-block w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 font-semibold">Memuat Katalog...</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="max-h-[750px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-[var(--card-border)] text-sm text-slate-400 sticky top-0 bg-[var(--card)] z-10">
                  <tr>
                    <th className="p-4 font-semibold">KODE ALAT</th>
                    <th className="p-4 font-semibold">MERK / NAMA ALAT</th>
                    <th className="p-4 font-semibold">KATEGORI</th>
                    <th className="p-4 text-center font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {assets.filter(a => selectedCat ? a.category_id === selectedCat : true).length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Tidak ada alat di kategori ini.</td></tr>
                  )}
                  {assets.filter(a => selectedCat ? a.category_id === selectedCat : true).map(asset => (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-800/30 transition cursor-pointer"
                      onClick={() => { setInputCode(asset.code); fetchScanData(asset.code); window.scrollTo(0, 0); }}
                    >
                      <td className="p-4 font-mono font-semibold text-[var(--accent-secondary)]">{asset.code}</td>
                      <td className="p-4 font-semibold">{asset.name}</td>
                      <td className="p-4 text-sm text-slate-400">{asset.category?.name}</td>
                      <td className="p-4 text-center">{statusBadge(asset.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CekAlatGateway() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-semibold">Memuat Sistem...</p>
        </div>
      </div>
    }>
      <CekAlatContent />
    </Suspense>
  );
}
