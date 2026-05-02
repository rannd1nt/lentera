"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function ReturnFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const submissionToken = searchParams.get('submission_token');

  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    asset_code: '',
    student_npm: ''
  });

  useEffect(() => {
    if (!submissionToken) {
      setError('Akses ditolak. Token sesi tidak ditemukan.');
      setLoadingOptions(false);
      return;
    }

    const fetchOptions = async () => {
      try {
        const res = await api.get(`/assets/form-options?submission_token=${submissionToken}&status=borrowed`);
        setOptions(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal mengambil data alat yang sedang dipinjam.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [submissionToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        submission_token: submissionToken,
        asset_code: formData.asset_code,
        student_npm: formData.student_npm
      };

      await api.post('/return', payload);
      toast.success('Pengembalian berhasil! Terima kasih.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Pengembalian gagal.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-10 text-center animate-lentera-slide-up">
        <div className="text-red-400 font-bold">{error}</div>
      </Card>
    </div>
  );

  if (loadingOptions) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold">Memuat daftar alat yang dipinjam...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />

      <Card className="max-w-lg w-full p-8 relative z-10 animate-lentera-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-400 mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Form Pengembalian Alat</h1>
        </div>

        {options.length === 0 ? (
          <div className="text-center p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-amber-400 font-semibold">Tidak ada alat yang sedang dipinjam saat ini.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Pilih Alat yang Ingin Dikembalikan</label>
              <select
                name="asset_code"
                value={formData.asset_code}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all duration-200"
              >
                <option value="">-- Pilih Alat --</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label} ({opt.category})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Masukkan NPM Peminjam"
              type="text"
              name="student_npm"
              value={formData.student_npm}
              onChange={handleChange}
              required
              placeholder="Contoh: 12345678"
            />
            <p className="text-xs text-slate-500 -mt-2">
              * NPM harus sesuai dengan NPM saat melakukan peminjaman alat.
            </p>

            <Button type="submit" variant="success" size="lg" fullWidth className="mt-2">
              Submit Pengembalian
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function ReturnForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-semibold">Memuat Form...</p>
        </div>
      </div>
    }>
      <ReturnFormContent />
    </Suspense>
  );
}
