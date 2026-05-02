"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { setSudoHeader } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { QRCodeCanvas } from 'qrcode.react';

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const qrBatchRef = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showSudoModal, setShowSudoModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: string, id?: number, payload?: any} | null>(null);

  const [catModal, setCatModal] = useState<{isOpen: boolean, type: 'add'|'edit', data: any}>({isOpen: false, type: 'add', data: {name: ''}});
  const [assetModal, setAssetModal] = useState<{isOpen: boolean, type: 'add'|'edit', data: any}>({isOpen: false, type: 'add', data: {category_id: '', name: '', code: ''}});
  const [settingsModal, setSettingsModal] = useState<{isOpen: boolean, qr_interval: number, form_interval: number}>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('settings') : null;
    const defaults = { qr_interval: 30, form_interval: 15 };
    const parsed = saved ? JSON.parse(saved) : defaults;
    return { isOpen: false, ...defaults, ...parsed };
  });
  const [qrModal, setQrModal] = useState<{isOpen: boolean, asset: any}>({isOpen: false, asset: null});
  const qrRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resAssets, resCats] = await Promise.all([api.get('/assets'), api.get('/categories')]);
      setAssets(resAssets.data.data);
      setCategories(resCats.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Sesi login telah habis. Silakan login kembali.");
        localStorage.removeItem('token');
        router.push('/');
      } else {
        toast.error("Gagal mengambil data dari server.");
      }
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Feature #10: Auto-refresh dashboard every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      console.log("Logout dari server gagal, hapus token lokal.");
    } finally {
      localStorage.removeItem('token');
      toast.info("Berhasil logout. Sampai jumpa!");
      router.push('/');
    }
  };

  const handleVerifySudo = async () => {
    try {
      const res = await api.post('/admin/sudo', { password: sudoPassword });
      setSudoHeader(res.data.sudo_token);

      if (pendingAction?.type === 'DELETE_ASSET') await api.delete(`/assets/${pendingAction.id}`);
      else if (pendingAction?.type === 'UPDATE_STATUS') await api.put(`/assets/${pendingAction.id}/status`, { status: pendingAction.payload });
      else if (pendingAction?.type === 'EDIT_ASSET') await api.put(`/assets/${pendingAction.id}`, pendingAction.payload);
      else if (pendingAction?.type === 'DELETE_CATEGORY') await api.delete(`/categories/${pendingAction.id}`);
      else if (pendingAction?.type === 'EDIT_CATEGORY') await api.put(`/categories/${pendingAction.id}`, pendingAction.payload);
      else if (pendingAction?.type === 'UPDATE_SETTINGS') await api.put('/admin/settings', pendingAction.payload);

      toast.success("Aksi berhasil dieksekusi!");
      setSudoPassword('');
      setShowSudoModal(false);
      setSudoHeader(null);
      fetchData();
      if (pendingAction?.type === 'DELETE_CATEGORY' && selectedCat === pendingAction.id) setSelectedCat(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Sesi habis, silakan login ulang.");
        localStorage.removeItem('token');
        router.push('/');
      } else {
        toast.error(err.response?.data?.message || "Password Sudo salah!");
      }
    }
  };

  const triggerAction = (type: string, id?: number, payload?: any, currentStatus?: string) => {
    if (currentStatus === 'borrowed') {
      toast.warning("Alat sedang dipinjam mahasiswa, tidak bisa diubah.");
      return;
    }
    setPendingAction({ type, id, payload });
    setShowSudoModal(true);
  };

  const saveCategory = async () => {
    if (!catModal.data.name.trim()) {
      toast.warning("Nama kategori tidak boleh kosong.");
      return;
    }
    if (catModal.type === 'add') {
      try {
        await api.post('/categories', catModal.data);
        toast.success("Kategori berhasil ditambahkan!");
        setCatModal({ ...catModal, isOpen: false });
        fetchData();
      } catch (err: any) { toast.error(err.response?.data?.message || "Gagal menambahkan kategori."); }
    } else {
      triggerAction('EDIT_CATEGORY', catModal.data.id, { name: catModal.data.name });
      setCatModal({ ...catModal, isOpen: false });
    }
  };

  const openAssetForm = (type: 'add' | 'edit', asset: any = null) => {
    if (type === 'edit' && asset?.status === 'borrowed') {
      toast.warning("Alat sedang dipinjam, tidak bisa diedit.");
      return;
    }
    setAssetModal({
      isOpen: true,
      type,
      data: asset || { category_id: selectedCat || (categories[0]?.id || ''), name: '', code: '' }
    });
  };

  const saveAsset = async () => {
    if (!assetModal.data.code.trim() || !assetModal.data.name.trim()) {
      toast.warning("Kode dan nama alat harus diisi.");
      return;
    }
    if (assetModal.type === 'add') {
      try {
        await api.post('/assets', assetModal.data);
        toast.success("Alat berhasil ditambahkan!");
        setAssetModal({ ...assetModal, isOpen: false });
        fetchData();
      } catch (err: any) { toast.error(err.response?.data?.message || "Gagal menambahkan alat."); }
    } else {
      triggerAction('EDIT_ASSET', assetModal.data.id, assetModal.data);
      setAssetModal({ ...assetModal, isOpen: false });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('settings', JSON.stringify({
      qr_interval: settingsModal.qr_interval,
      form_interval: settingsModal.form_interval
    }));
    triggerAction('UPDATE_SETTINGS', undefined, {
      qr_interval: Number(settingsModal.qr_interval),
      form_interval: Number(settingsModal.form_interval)
    });
    setSettingsModal(p => ({ ...p, isOpen: false }));
  };

  const getTxn = (a: any) => a.lastTransaction ?? a.last_transaction ?? null;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge variant="success">Tersedia</Badge>;
      case 'borrowed': return <Badge variant="warning">Dipinjam</Badge>;
      case 'maintenance': return <Badge variant="danger">Maintenance</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getAssetQRUrl = (code: string) => {
    return `${window.location.origin}/cek-alat?code=${encodeURIComponent(code)}`;
  };

  const downloadQR = (assetCode: string) => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `QR-${assetCode}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    toast.success("QR Code berhasil di-download!");
  };

  // Feature #7: Batch download all QR codes
  const downloadAllQR = async () => {
    toast.info("Menyiapkan download semua QR code...");
    const containers = qrBatchRef.current?.querySelectorAll('[data-qr-batch]');
    if (!containers) return;
    for (const container of Array.from(containers)) {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        const assetId = container.getAttribute('data-qr-batch');
        const asset = assets.find(a => a.id == assetId);
        if (!asset) continue;
        const link = document.createElement('a');
        link.download = `QR-${asset.code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    toast.success("Semua QR code berhasil di-download!");
  };

  // Feature #6: Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Kode "${text}" berhasil disalin!`);
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  // Feature #15: Export CSV
  const exportCSV = () => {
    const headers = ["Kode", "Nama", "Kategori", "Status", "Peminjam", "Dipinjam Sejak"];
    const rows = filteredAssets.map(a => {
      const txn = getTxn(a);
      return [
        a.code,
        a.name,
        a.category?.name || '-',
        a.status,
        txn?.student_name || '-',
        txn?.borrowed_at || '-'
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lentera-assets-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("Data aset berhasil di-export!");
  };

  // Feature #14: Theme toggle
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const isLight = current === "light-mode";
    const newTheme = isLight ? "dark-mode" : "light-mode";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const stats = useMemo(() => {
    const total = assets.length;
    const available = assets.filter(a => a.status === 'available').length;
    const borrowed = assets.filter(a => a.status === 'borrowed').length;
    const maintenance = assets.filter(a => a.status === 'maintenance').length;
    return { total, available, borrowed, maintenance };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assets.filter(a => {
      const matchCat = selectedCat ? a.category_id === selectedCat : true;
      const matchSearch = !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [assets, selectedCat, searchQuery]);

  // Feature #13: Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'k', ctrl: true, handler: () => searchRef.current?.focus() },
    { key: 'Escape', handler: () => { setShowSudoModal(false); setShowLogoutModal(false); setCatModal(p => ({...p, isOpen: false})); setAssetModal(p => ({...p, isOpen: false})); setSettingsModal(p => ({...p, isOpen: false})); setQrModal({isOpen: false, asset: null}); } },
    { key: 'l', ctrl: true, handler: () => setShowLogoutModal(true) },
  ], []);
  useKeyboardShortcuts(shortcuts);

  if (loading) return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <Skeleton variant="rectangular" height="h-16" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" height="h-20" />)}
      </div>
      <Skeleton variant="rectangular" height="h-12" className="mb-6" />
      <Skeleton variant="table" lines={6} />
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="p-6 min-h-screen relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[var(--accent-secondary)]/5 via-transparent to-transparent pointer-events-none" />

        {/* NAV BAR */}
        <Card className="p-4 mb-6 relative z-10">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Button variant={selectedCat === null ? "primary" : "ghost"} size="sm" onClick={() => setSelectedCat(null)} className="whitespace-nowrap">Semua Aset</Button>
            {categories.map(cat => (
              <Button key={cat.id} variant={selectedCat === cat.id ? "primary" : "ghost"} size="sm" onClick={() => setSelectedCat(cat.id)} className="whitespace-nowrap">
                {cat.name} <span className="ml-1 text-xs opacity-70">({cat.assets_count})</span>
              </Button>
            ))}
            <Button variant="success" size="sm" onClick={() => setCatModal({isOpen: true, type: 'add', data: {name: ''}})} className="shrink-0 !px-3 !shadow-none" title="Tambah Kategori">+</Button>
            {selectedCat !== null && (
              <>
                <Button variant="warning" size="sm" onClick={() => { const cat = categories.find(c => c.id === selectedCat); setCatModal({isOpen: true, type: 'edit', data: {id: cat.id, name: cat.name}}); }} className="shrink-0 !px-3 !shadow-none !text-white" title="Edit Kategori">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </Button>
                <Button variant="danger" size="sm" onClick={() => triggerAction('DELETE_CATEGORY', selectedCat)} className="shrink-0 !px-3 !shadow-none" title="Hapus Kategori">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </Button>
              </>
            )}

            <div className="flex-1"></div>

            {/* Feature #14: Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => router.push('/display')}><span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Barcode</span></Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/print-labels')}><span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>Print</span></Button>
            <Button variant="ghost" size="sm" onClick={() => setSettingsModal(p => ({...p, isOpen: true}))}><span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings</span></Button>
            <Button variant="danger" size="sm" onClick={() => setShowLogoutModal(true)}><span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>Logout</span></Button>
          </div>
        </Card>

        {/* Feature #1: STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-secondary)]/15 flex items-center justify-center"><svg className="w-5 h-5 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
              <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-slate-400">Total Aset</p></div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center"><svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <div><p className="text-2xl font-bold text-emerald-400">{stats.available}</p><p className="text-xs text-slate-400">Tersedia</p></div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center"><svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
              <div><p className="text-2xl font-bold text-amber-400">{stats.borrowed}</p><p className="text-xs text-slate-400">Dipinjam</p></div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center"><svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></div>
              <div><p className="text-2xl font-bold text-red-400">{stats.maintenance}</p><p className="text-xs text-slate-400">Maintenance</p></div>
            </div>
          </Card>
        </div>

        <div className="relative z-10">


          {/* Feature #2: SEARCH + TABLE + #7 + #15: Batch QR + Export */}
          <Card className="overflow-hidden relative z-10">
              <div className="p-4 border-b border-[var(--card-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--overlay)]/50">
                <h2 className="font-bold text-lg">Daftar Alat Laboratorium</h2>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:flex-none sm:w-56">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari alat... (Ctrl+K)" className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-sm text-[var(--foreground)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all" />
                  </div>
                  <Button variant="success" size="sm" onClick={() => openAssetForm('add')} className="!shadow-none">+ Tambah</Button>
                  <Button variant="ghost" size="sm" onClick={downloadAllQR} className="text-xs">Batch QR</Button>
                  <Button variant="ghost" size="sm" onClick={exportCSV} className="text-xs">Export CSV</Button>
                </div>
              </div>

              <div className="h-[750px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-[var(--card-border)] text-sm text-slate-400">
                    <tr>
                      <th className="p-4 font-semibold">KODE | MERK ALAT</th>
                      <th className="p-4 font-semibold">STATUS</th>
                      <th className="p-4 font-semibold">PEMINJAM SAAT INI</th>
                      <th className="p-4 text-center font-semibold">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {filteredAssets.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">{searchQuery ? `Tidak ada alat yang cocok dengan "${searchQuery}"` : "Tidak ada alat di kategori ini."}</td></tr>
                    )}
                    {filteredAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-[var(--overlay)]/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[var(--accent-secondary)] cursor-pointer hover:underline" onClick={() => copyToClipboard(asset.code)} title="Klik untuk copy">{asset.code}</span>
                          </div>
                          <div className="text-xs text-slate-500">{asset.name}</div>
                        </td>
                        <td className="p-4">{statusBadge(asset.status)}</td>
                        <td className="p-4">
                          {asset.status === 'borrowed' && getTxn(asset) ? (
                            <div><div className="text-sm font-semibold">{getTxn(asset).student_name}</div><div className="text-xs text-slate-500 font-mono">{getTxn(asset).borrowed_at}</div></div>
                          ) : (<span className="text-slate-600 text-sm italic">-</span>)}
                        </td>
                        <td className="p-4 flex gap-2 justify-center flex-wrap">
                          {asset.status === 'available' ? (<Button variant="ghost" size="sm" onClick={() => triggerAction('UPDATE_STATUS', asset.id, 'maintenance', asset.status)} className="!text-xs">MAINTENANCE</Button>)
                            : asset.status === 'maintenance' ? (<Button variant="ghost" size="sm" onClick={() => triggerAction('UPDATE_STATUS', asset.id, 'available', asset.status)} className="!text-emerald-400 !text-xs">AVAILABLE</Button>) : null}
                          <Button variant="ghost" size="sm" onClick={() => setQrModal({isOpen: true, asset})} className="!text-[var(--accent-secondary)] !text-xs"><span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 4h.01M6 4h.01M6 8h.01M6 12h4.01M6 16h.01M6 20h.01M12 20h.01M16 20h.01M20 20h.01M20 16h.01M20 12h.01M20 8h.01M20 4h.01" /></svg>QR</span></Button>
                          <Button variant="ghost" size="sm" onClick={() => openAssetForm('edit', asset)} className="!text-indigo-400 !text-xs">EDIT</Button>
                          <Button variant="ghost" size="sm" onClick={() => triggerAction('DELETE_ASSET', asset.id, null, asset.status)} className="!text-red-400 !text-xs">HAPUS</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
        </div>

        {/* Hidden container for batch QR */}
        <div ref={qrBatchRef} className="hidden">
          {assets.map(asset => (
            <div key={asset.id} data-qr-batch={asset.id}>
              <QRCodeCanvas value={getAssetQRUrl(asset.code)} size={200} level="M" />
            </div>
          ))}
        </div>

        {/* CATEGORY MODAL */}
        <Modal isOpen={catModal.isOpen} onClose={() => setCatModal({...catModal, isOpen: false})} title={catModal.type === 'add' ? 'Tambah Kategori Baru' : 'Edit Kategori'}>
          <Input type="text" value={catModal.data.name} onChange={(e) => setCatModal({...catModal, data: {...catModal.data, name: e.target.value}})} placeholder="Nama Kategori (Cth: Proyektor)" className="mb-6" />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setCatModal({...catModal, isOpen: false})}>Batal</Button>
            <Button variant="success" fullWidth onClick={saveCategory}>Simpan</Button>
          </div>
        </Modal>

        {/* ASSET MODAL */}
        <Modal isOpen={assetModal.isOpen} onClose={() => setAssetModal({...assetModal, isOpen: false})} title={assetModal.type === 'add' ? 'Tambah Alat Baru' : 'Edit Alat'} size="lg">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Kategori</label>
              <select value={assetModal.data.category_id} onChange={(e) => setAssetModal({...assetModal, data: {...assetModal.data, category_id: e.target.value}})} className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all duration-200">
                <option value="">-- Pilih Kategori --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Kode Alat" type="text" value={assetModal.data.code} onChange={(e) => setAssetModal({...assetModal, data: {...assetModal.data, code: e.target.value}})} placeholder="Cth: LPT-01" />
            <Input label="Nama / Merk Alat" type="text" value={assetModal.data.name} onChange={(e) => setAssetModal({...assetModal, data: {...assetModal.data, name: e.target.value}})} placeholder="Cth: Lenovo Thinkpad" />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setAssetModal({...assetModal, isOpen: false})}>Batal</Button>
            <Button variant="success" fullWidth onClick={saveAsset}>Simpan</Button>
          </div>
        </Modal>

        {/* SETTINGS MODAL */}
        <Modal isOpen={settingsModal.isOpen} onClose={() => setSettingsModal({...settingsModal, isOpen: false})} title="Pengaturan Interval">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Interval Refresh Barcode (Menit)</label>
              <Input type="number" min="1" value={settingsModal.qr_interval} onChange={(e) => setSettingsModal({...settingsModal, qr_interval: Number(e.target.value)})} />
              <p className="text-xs text-slate-500 mt-1">Siklus perubahan gambar barcode di layar Monitor Kiosk.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Durasi Isi Form Peminjaman (Menit)</label>
              <Input type="number" min="1" value={settingsModal.form_interval} onChange={(e) => setSettingsModal({...settingsModal, form_interval: Number(e.target.value)})} />
              <p className="text-xs text-slate-500 mt-1">Lama waktu token akses mahasiswa berlaku sebelum kadaluarsa.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setSettingsModal({...settingsModal, isOpen: false})}>Batal</Button>
            <Button variant="primary" fullWidth onClick={saveSettings}>Simpan & Otorisasi</Button>
          </div>
        </Modal>

        {/* SUDO MODAL */}
        <Modal isOpen={showSudoModal} onClose={() => setShowSudoModal(false)} size="sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/15 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
            <h3 className="text-2xl font-bold mb-2">Sudo Mode</h3>
            <p className="text-sm text-slate-400 mb-6">Aksi ini memerlukan otorisasi tingkat lanjut. Masukkan password Admin Anda.</p>
            <Input type="password" value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="••••••••" variant="mono" className="mb-6 text-center text-lg tracking-widest" autoFocus />
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowSudoModal(false)}>Batal</Button>
              <Button variant="primary" fullWidth onClick={handleVerifySudo}>Otorisasi</Button>
            </div>
          </div>
        </Modal>

        {/* QR CODE MODAL */}
        <Modal isOpen={qrModal.isOpen} onClose={() => setQrModal({isOpen: false, asset: null})} title={`QR Code — ${qrModal.asset?.code}`} size="md">
          {qrModal.asset && (
            <div className="text-center">
              <div ref={qrRef} className="inline-block bg-white p-6 rounded-2xl mb-4">
                <QRCodeCanvas value={getAssetQRUrl(qrModal.asset.code)} size={280} level={"H"} includeMargin={true} />
              </div>
              <p className="text-sm text-slate-400 mb-2 font-mono">{getAssetQRUrl(qrModal.asset.code)}</p>
              <p className="text-xs text-slate-500 mb-6">Scan QR ini untuk langsung membuka halaman detail alat <span className="font-mono text-[var(--accent-secondary)]">{qrModal.asset.code}</span></p>
              <Button variant="primary" size="lg" fullWidth onClick={() => downloadQR(qrModal.asset.code)}>
                <span className="flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download QR sebagai JPG</span>
              </Button>
            </div>
          )}
        </Modal>

        {/* LOGOUT CONFIRMATION MODAL */}
        <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Konfirmasi Logout" size="sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/15 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
            <h3 className="text-xl font-bold mb-2">Apakah Anda Ingin Keluar?</h3>
            <p className="text-sm text-slate-400 mb-6">Sesi login Anda akan diakhiri dan harus login kembali untuk mengakses dashboard.</p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowLogoutModal(false)}>Batal</Button>
              <Button variant="danger" fullWidth onClick={handleLogout}>Keluar</Button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
