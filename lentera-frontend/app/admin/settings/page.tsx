"use client";

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [qrInterval, setQrInterval] = useState(30);
  const [formInterval, setFormInterval] = useState(15);
  const [saving, setSaving] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [showSudoModal, setShowSudoModal] = useState(false);

  const handleSave = () => {
    setShowSudoModal(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/sudo', { password: sudoPassword });
      const sudoToken = res.data.sudo_token;
      api.defaults.headers.common['X-Sudo-Token'] = sudoToken;

      await api.put('/admin/settings', {
        qr_interval: Number(qrInterval),
        form_interval: Number(formInterval)
      });

      toast.success("Pengaturan berhasil disimpan!");
      setShowSudoModal(false);
      setSudoPassword('');
      delete api.defaults.headers.common['X-Sudo-Token'];
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Sesi habis, silakan login ulang.");
        localStorage.removeItem('token');
        router.push('/');
      } else {
        toast.error(err.response?.data?.message || "Password salah!");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6 max-w-2xl mx-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[var(--accent-secondary)]/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 animate-lentera-slide-up">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </span>
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">Pengaturan Sistem</h1>
              <p className="text-slate-400 text-sm">Kelola konfigurasi interval dan sistem</p>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div>
              <Input
                label="Interval Refresh Barcode (Menit)"
                type="number" min="1"
                value={qrInterval}
                onChange={(e) => setQrInterval(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-2">Siklus perubahan gambar barcode di layar Monitor Kiosk.</p>
            </div>

            <div className="border-t border-[var(--card-border)]" />

            <div>
              <Input
                label="Durasi Isi Form Peminjaman (Menit)"
                type="number" min="1"
                value={formInterval}
                onChange={(e) => setFormInterval(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-2">Lama waktu token akses mahasiswa berlaku sebelum kadaluarsa.</p>
            </div>

            <div className="pt-4">
              <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Pengaturan
                </span>
              </Button>
            </div>
          </Card>
        </div>

        <Modal isOpen={showSudoModal} onClose={() => setShowSudoModal(false)} size="sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/15 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Verifikasi Admin</h3>
            <p className="text-sm text-slate-400 mb-6">Masukkan password untuk menyimpan pengaturan.</p>
            <Input
              type="password"
              value={sudoPassword}
              onChange={(e) => setSudoPassword(e.target.value)}
              placeholder="••••••••"
              variant="mono"
              className="mb-6 text-center text-lg tracking-widest"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowSudoModal(false)}>Batal</Button>
              <Button variant="primary" fullWidth loading={saving} onClick={confirmSave}>Otorisasi</Button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
