"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

function CekAlatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCode = searchParams.get('code');

  // State untuk Fitur Search (KTP Alat)
  const [inputCode, setInputCode] = useState('');
  const [scanData, setScanData] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  // State untuk Fitur Tabel (Katalog Publik)
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [tableLoading, setTableLoading] = useState(true);

  // Auto-fetch data scan kalau ada parameter ?code= di URL
  useEffect(() => {
    if (urlCode) {
      setInputCode(urlCode);
      fetchScanData(urlCode);
    }
  }, [urlCode]);

  // Fetch seluruh katalog pas halaman pertama kali dibuka
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

  // Fungsi khusus nyari data 1 alat berdasarkan kode
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* 🌟 BAGIAN 1: SEARCH & INFO KTP ALAT 🌟 */}
      <div className="bg-slate-900 text-white pt-20 pb-12 px-6 flex flex-col items-center shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-cyan-400 tracking-wider">LENTERA PUBLIC</h1>
          <p className="text-slate-400 mt-2">Cari Kode / Scan QR untuk mengecek detail alat</p>
        </div>

        <form onSubmit={handleManualSearch} className="w-full max-w-lg flex gap-2">
          <input 
            type="text" 
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Masukkan Kode Alat (Cth: INV-01)" 
            className="flex-1 p-4 rounded-xl text-black font-bold outline-none uppercase"
          />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 px-6 py-4 rounded-xl font-bold transition shadow-lg">
            Cari
          </button>
        </form>

        {/* LOADING & ERROR SEARCH */}
        {scanLoading && <div className="mt-8 animate-pulse text-cyan-400 font-bold">Mencari Data... ⏳</div>}
        {scanError && (
          <div className="mt-8 w-full max-w-lg p-4 bg-red-500/20 border border-red-500 rounded-xl text-center">
            <h3 className="font-bold text-red-400">{scanError}</h3>
          </div>
        )}

        {/* HASIL DATA SEARCH */}
        {scanData && !scanLoading && (
          <div className="mt-8 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800">
            <div className="p-6 bg-slate-100 text-center relative border-b">
              <div className="text-xs font-bold text-cyan-700 tracking-widest mb-1 uppercase">{scanData.category}</div>
              <h2 className="text-2xl font-black mb-2">{scanData.name}</h2>
              <div className="inline-block bg-slate-800 text-white px-4 py-1 rounded-full font-mono text-sm tracking-widest">{scanData.code}</div>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center">
                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
                  scanData.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 
                  scanData.status === 'borrowed' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  Status: {scanData.status}
                </span>
              </div>
              {scanData.status === 'borrowed' && scanData.borrower && (
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm">
                  <h3 className="font-bold text-amber-900 mb-3 border-b border-amber-200 pb-2">📦 Sedang Dipinjam Oleh:</h3>
                  <div className="flex justify-between mb-1"><span className="opacity-70">Nama</span><span className="font-bold">{scanData.borrower.name}</span></div>
                  <div className="flex justify-between mb-1"><span className="opacity-70">Kelas</span><span className="font-bold">{scanData.borrower.class}</span></div>
                  <div className="flex justify-between mb-1"><span className="opacity-70">Matkul</span><span className="font-bold">{scanData.borrower.subject}</span></div>
                  <div className="flex justify-between mt-3 pt-2 border-t border-amber-200"><span className="opacity-70 text-xs">Sejak</span><span className="font-bold text-xs">{scanData.borrower.borrowed_at}</span></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🌟 BAGIAN 2: KATALOG ALAT (TABEL PUBLIK) 🌟 */}
      <div className="p-8 max-w-6xl mx-auto mt-4">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Katalog Alat Laboratorium</h2>
        
        {/* PILE KATEGORI (Filter) */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedCat(null)}
            className={`px-5 py-2 rounded-full font-bold border text-sm transition ${selectedCat === null ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            Semua Aset
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCat(cat.id)}
              className={`px-5 py-2 rounded-full font-bold border text-sm whitespace-nowrap transition ${selectedCat === cat.id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {cat.name} <span className="ml-1 opacity-70">({cat.assets_count})</span>
            </button>
          ))}
        </div>

        {/* TABEL DATA */}
        {tableLoading ? (
          <div className="p-10 text-center font-bold text-slate-500 bg-white border rounded-2xl">Memuat Katalog... ⏳</div>
        ) : (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b text-sm text-slate-600">
                  <tr>
                    <th className="p-4">KODE ALAT</th>
                    <th className="p-4">MERK / NAMA ALAT</th>
                    <th className="p-4">KATEGORI</th>
                    <th className="p-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assets.filter(a => selectedCat ? a.category_id === selectedCat : true).length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Tidak ada alat di kategori ini.</td></tr>
                  )}
                  {assets.filter(a => selectedCat ? a.category_id === selectedCat : true).map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => { setInputCode(asset.code); fetchScanData(asset.code); window.scrollTo(0, 0); }}>
                      <td className="p-4 font-mono font-bold text-slate-700">{asset.code}</td>
                      <td className="p-4 font-semibold text-slate-800">{asset.name}</td>
                      <td className="p-4 text-sm text-slate-500">{asset.category?.name}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                          asset.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          asset.status === 'borrowed' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function CekAlatGateway() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-slate-800 min-h-screen bg-slate-100 pt-20">Memuat Sistem... ⏳</div>}>
      <CekAlatContent />
    </Suspense>
  );
}