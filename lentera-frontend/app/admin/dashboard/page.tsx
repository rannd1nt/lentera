"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { setSudoHeader } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Sudo Mode
  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: string, id?: number, payload?: any} | null>(null);

  // State untuk Modal Form (CRUD & Settings)
  const [catModal, setCatModal] = useState<{isOpen: boolean, type: 'add'|'edit', data: any}>({isOpen: false, type: 'add', data: {name: ''}});
  const [assetModal, setAssetModal] = useState<{isOpen: boolean, type: 'add'|'edit', data: any}>({isOpen: false, type: 'add', data: {category_id: '', name: '', code: ''}});
  const [settingsModal, setSettingsModal] = useState({isOpen: false, qr_interval: 30, form_interval: 15});

  const fetchData = async () => {
    try {
      const [resAssets, resCats] = await Promise.all([api.get('/assets'), api.get('/categories')]);
      setAssets(resAssets.data.data);
      setCategories(resCats.data.data);
    } catch (err: any) {
      // HANDLE 401 UNAUTHORIZED DI SINI BIAR NEXT.JS GAK MELEDAK
      if (err.response?.status === 401) {
        alert("Sesi login Anda telah habis atau tidak valid. Silakan login kembali.");
        localStorage.removeItem('token');
        router.push('/');
      } else {
        console.error("Gagal ambil data", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC LOGOUT ---
  const handleLogout = async () => {
    try {
      await api.post('/logout'); 
    } catch (err: any) {
      // Abaikan error 401 saat logout (biar gak muncul alert dobel kalau emang token udah expired)
      console.log("Logout dari server gagal, hapus token lokal.");
    } finally {
      localStorage.removeItem('token');
      router.push('/');
    }
  };

  // --- LOGIC SUDO & EKSEKUSI ---
  const handleVerifySudo = async () => {
    try {
      const res = await api.post('/admin/sudo', { password: sudoPassword });
      setSudoHeader(res.data.sudo_token);
      
      // Eksekusi aksi yang tertunda
      if (pendingAction?.type === 'DELETE_ASSET') await api.delete(`/assets/${pendingAction.id}`);
      else if (pendingAction?.type === 'UPDATE_STATUS') await api.put(`/assets/${pendingAction.id}/status`, { status: pendingAction.payload });
      else if (pendingAction?.type === 'EDIT_ASSET') await api.put(`/assets/${pendingAction.id}`, pendingAction.payload);
      else if (pendingAction?.type === 'DELETE_CATEGORY') await api.delete(`/categories/${pendingAction.id}`);
      else if (pendingAction?.type === 'EDIT_CATEGORY') await api.put(`/categories/${pendingAction.id}`, pendingAction.payload);
      else if (pendingAction?.type === 'UPDATE_SETTINGS') await api.put('/admin/settings', pendingAction.payload); // Eksekusi Settings

      alert("Aksi Berhasil Dieksekusi!");
      setSudoPassword('');
      setShowSudoModal(false);
      setSudoHeader(null);
      fetchData();
      if (pendingAction?.type === 'DELETE_CATEGORY' && selectedCat === pendingAction.id) setSelectedCat(null);
    } catch (err: any) {
      // Cek kalau 401 pas lagi Sudo (token auth utamanya yang habis)
      if (err.response?.status === 401) {
        alert("Sesi habis, silakan login ulang.");
        localStorage.removeItem('token');
        router.push('/');
      } else {
        alert(err.response?.data?.message || "Password Sudo Salah atau Sesi Gagal!");
      }
    }
  };

  const triggerAction = (type: string, id?: number, payload?: any, currentStatus?: string) => {
    if (currentStatus === 'borrowed') return alert("⚠️ Gagal! Alat sedang dipinjam mahasiswa.");
    setPendingAction({ type, id, payload });
    setShowSudoModal(true);
  };

  // --- LOGIC FORM CATEGORY ---
  const saveCategory = async () => {
    if (catModal.type === 'add') {
      try {
        await api.post('/categories', catModal.data);
        alert('Kategori berhasil ditambahkan!');
        setCatModal({ ...catModal, isOpen: false });
        fetchData();
      } catch (err: any) { alert("Gagal: " + (err.response?.data?.message || err.message)); }
    } else {
      triggerAction('EDIT_CATEGORY', catModal.data.id, { name: catModal.data.name });
      setCatModal({ ...catModal, isOpen: false });
    }
  };

  // --- LOGIC FORM ASSET ---
  const openAssetForm = (type: 'add' | 'edit', asset: any = null) => {
    if (type === 'edit' && asset?.status === 'borrowed') return alert("Gagal! Alat sedang dipinjam, tidak bisa diedit.");
    setAssetModal({
      isOpen: true, 
      type, 
      data: asset || { category_id: selectedCat || (categories[0]?.id || ''), name: '', code: '' }
    });
  };

  const saveAsset = async () => {
    if (assetModal.type === 'add') {
      try {
        await api.post('/assets', assetModal.data);
        alert('Alat berhasil ditambahkan!');
        setAssetModal({ ...assetModal, isOpen: false });
        fetchData();
      } catch (err: any) { alert("Gagal: " + (err.response?.data?.message || err.message)); }
    } else {
      triggerAction('EDIT_ASSET', assetModal.data.id, assetModal.data);
      setAssetModal({ ...assetModal, isOpen: false });
    }
  };

  // --- LOGIC SETTINGS ---
  const saveSettings = () => {
    triggerAction('UPDATE_SETTINGS', undefined, {
      qr_interval: Number(settingsModal.qr_interval),
      form_interval: Number(settingsModal.form_interval)
    });
    setSettingsModal({ ...settingsModal, isOpen: false });
  };

  if (loading) return <div className="p-10 text-center font-bold text-black min-h-screen bg-white">Memuat Dashboard... ⏳</div>;

  return (
    <ProtectedRoute>
      <div className="p-8 bg-slate-50 min-h-screen text-black">
        
        {/* --- PILE-PILE CATEGORY & NAV --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex items-center gap-4 overflow-x-auto">
          <button 
            onClick={() => setSelectedCat(null)}
            className={`px-4 py-2 rounded-lg font-bold border transition ${selectedCat === null ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Semua Aset
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-lg font-bold border whitespace-nowrap transition ${selectedCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              {cat.name} <span className="ml-1 text-xs opacity-70">({cat.assets_count})</span>
            </button>
          ))}
          
          <button 
            onClick={() => setCatModal({isOpen: true, type: 'add', data: {name: ''}})}
            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg w-10 h-10 font-bold flex items-center justify-center shrink-0" title="Tambah Kategori"
          >
            +
          </button>
          
          <div className="flex-1"></div>
          
          <button onClick={() => router.push('/display')} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap">📺 BUKA BARCODE</button>
          
          {/* TOMBOL SETTINGS */}
          <button 
            onClick={() => setSettingsModal({isOpen: true, qr_interval: 30, form_interval: 15})} 
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap"
          >
            ⚙️ SETTINGS
          </button>
          
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap transition">🚪 LOGOUT</button>
        </div>

        {/* --- KONTROL KATEGORI (MUNCUL JIKA KATEGORI DIPILIH) --- */}
        {selectedCat !== null && (
          <div className="mb-4 flex gap-2">
            <button 
              onClick={() => {
                const cat = categories.find(c => c.id === selectedCat);
                setCatModal({isOpen: true, type: 'edit', data: {id: cat.id, name: cat.name}});
              }}
              className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded hover:bg-amber-200 transition"
            >
              ✎ Edit Kategori Ini
            </button>
            <button 
              onClick={() => triggerAction('DELETE_CATEGORY', selectedCat)}
              className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1 rounded hover:bg-red-200 transition"
            >
              🗑️ Hapus Kategori Ini
            </button>
          </div>
        )}

        {/* --- TABLE ASSETS --- */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b flex justify-between items-center bg-slate-100">
            <h2 className="font-bold text-lg text-slate-800">Daftar Alat Laboratorium</h2>
            <button 
              onClick={() => openAssetForm('add')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold text-sm"
            >
              + Tambah Alat
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b text-sm text-slate-500">
                <tr>
                  <th className="p-4">KODE | MERK ALAT</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">PEMINJAM SAAT INI</th>
                  <th className="p-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.filter(a => selectedCat ? a.category_id === selectedCat : true).length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada alat di kategori ini.</td></tr>
                )}
                {assets.filter(a => selectedCat ? a.category_id === selectedCat : true).map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{asset.code}</div>
                      <div className="text-xs text-slate-500">{asset.name}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
                        asset.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' : 
                        asset.status === 'borrowed' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {asset.status === 'borrowed' && asset.last_transaction ? (
                        <div>
                          <div className="text-sm font-bold text-slate-700">{asset.last_transaction.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{asset.last_transaction.borrowed_at}</div>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm italic">-</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 justify-center flex-wrap">
                      {asset.status === 'available' ? (
                        <button onClick={() => triggerAction('UPDATE_STATUS', asset.id, 'maintenance', asset.status)} className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded font-bold transition">MAINTENANCE</button>
                      ) : asset.status === 'maintenance' ? (
                        <button onClick={() => triggerAction('UPDATE_STATUS', asset.id, 'available', asset.status)} className="text-[10px] bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded font-bold transition">AVAILABLE</button>
                      ) : null}
                      
                      <button onClick={() => openAssetForm('edit', asset)} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded font-bold transition">EDIT</button>
                      <button onClick={() => triggerAction('DELETE_ASSET', asset.id, null, asset.status)} className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded font-bold transition">HAPUS</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL FORM CATEGORY --- */}
        {catModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border">
              <h3 className="text-xl font-bold mb-4">{catModal.type === 'add' ? 'Tambah Kategori Baru' : 'Edit Kategori'}</h3>
              <input 
                type="text" 
                value={catModal.data.name}
                onChange={(e) => setCatModal({...catModal, data: {...catModal.data, name: e.target.value}})}
                className="w-full p-3 border rounded-lg mb-6 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                placeholder="Nama Kategori (Cth: Proyektor)"
              />
              <div className="flex gap-3">
                <button onClick={() => setCatModal({...catModal, isOpen: false})} className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition">Batal</button>
                <button onClick={saveCategory} className="flex-1 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL FORM ASSET --- */}
        {assetModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border">
              <h3 className="text-xl font-bold mb-4">{assetModal.type === 'add' ? 'Tambah Alat Baru' : 'Edit Alat'}</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                  <select 
                    value={assetModal.data.category_id} 
                    onChange={(e) => setAssetModal({...assetModal, data: {...assetModal.data, category_id: e.target.value}})}
                    className="w-full p-3 border rounded-lg bg-slate-50 outline-none"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kode Alat</label>
                  <input type="text" value={assetModal.data.code} onChange={(e) => setAssetModal({...assetModal, data: {...assetModal.data, code: e.target.value}})} placeholder="Cth: LPT-01" className="w-full p-3 border rounded-lg bg-slate-50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama / Merk Alat</label>
                  <input type="text" value={assetModal.data.name} onChange={(e) => setAssetModal({...assetModal, data: {...assetModal.data, name: e.target.value}})} placeholder="Cth: Lenovo Thinkpad" className="w-full p-3 border rounded-lg bg-slate-50 outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAssetModal({...assetModal, isOpen: false})} className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition">Batal</button>
                <button onClick={saveAsset} className="flex-1 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL SETTINGS INTERVAL --- */}
        {settingsModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Pengaturan Interval (Menit)</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Interval Refresh Barcode (Menit)</label>
                  <input 
                    type="number" min="1"
                    value={settingsModal.qr_interval}
                    onChange={(e) => setSettingsModal({...settingsModal, qr_interval: Number(e.target.value)})}
                    className="w-full p-3 border rounded-lg bg-slate-50 outline-none" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Siklus perubahan gambar barcode di layar Monitor Kiosk.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Durasi Isi Form Peminjaman (Menit)</label>
                  <input 
                    type="number" min="1"
                    value={settingsModal.form_interval}
                    onChange={(e) => setSettingsModal({...settingsModal, form_interval: Number(e.target.value)})}
                    className="w-full p-3 border rounded-lg bg-slate-50 outline-none" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Lama waktu token akses mahasiswa berlaku sebelum kadaluarsa.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSettingsModal({...settingsModal, isOpen: false})} className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition">Batal</button>
                <button onClick={saveSettings} className="flex-1 p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition">Simpan & Otorisasi</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL SUDO MODE --- */}
        {showSudoModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-indigo-600 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div>
              <h3 className="text-2xl font-bold mb-2">Sudo Mode</h3>
              <p className="text-sm text-slate-500 mb-6">Aksi ini memerlukan otorisasi tingkat lanjut. Masukkan password Admin Anda.</p>
              <input 
                type="password" 
                value={sudoPassword}
                onChange={(e) => setSudoPassword(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 focus:border-indigo-600 rounded-lg mb-6 text-center text-lg tracking-widest outline-none transition" 
                placeholder="••••••••"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowSudoModal(false)} className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition">Batal</button>
                <button onClick={handleVerifySudo} className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-lg shadow-indigo-600/30">Otorisasi</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}