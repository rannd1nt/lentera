"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function BorrowFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const submissionToken = searchParams.get('submission_token');

  const [categories, setCategories] = useState<any[]>([]);
  const [allOptions, setAllOptions] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    student_name: '',
    student_npm: '',
    student_prodi: '',
    student_class: '',
    subject: '',
    lecturer: '',
    return_date: '',
    return_time: ''
  });

  useEffect(() => {
    if (!submissionToken) {
      setError('Akses ditolak. Token sesi tidak ditemukan.');
      setLoadingOptions(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [resOptions, resCats] = await Promise.all([
          api.get(`/assets/form-options?submission_token=${submissionToken}&status=available`),
          api.get('/categories')
        ]);
        setAllOptions(resOptions.data.data);
        setCategories(resCats.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal mengambil data alat.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchData();
  }, [submissionToken]);

  const filteredOptions = selectedCat
    ? allOptions.filter(opt => opt.category === selectedCat)
    : allOptions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { code, return_date, return_time, ...formDataWithoutCode } = formData;
      const expected_return_at = return_date && return_time
        ? `${return_date} ${return_time}:00`
        : null;

      const payload = {
        submission_token: submissionToken,
        ...formDataWithoutCode,
        asset_code: code,
        expected_return_at,
      };

      await api.post('/borrow', payload);
      toast.success('Peminjaman berhasil! Data sudah masuk ke database.');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Peminjaman gagal.');
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
        <p className="text-slate-400 font-semibold">Memuat daftar alat...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

      <Card className="max-w-lg w-full p-8 relative z-10 animate-lentera-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Form Peminjaman Alat</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Kategori</label>
            <select
              name="category_filter"
              value={selectedCat}
              onChange={(e) => { setSelectedCat(e.target.value); setFormData({ ...formData, code: '' }); }}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-secondary)] focus:ring-1 focus:ring-[var(--accent-secondary)] transition-all duration-200"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Pilih Alat</label>
            <select
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-secondary)] focus:ring-1 focus:ring-[var(--accent-secondary)] transition-all duration-200"
            >
              <option value="">-- Pilih Alat yang Tersedia --</option>
              {filteredOptions.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {filteredOptions.length === 0 && (
              <p className="text-xs text-slate-500 mt-1.5">Tidak ada alat tersedia di kategori ini.</p>
            )}
          </div>

          <Input label="Nama Lengkap" type="text" name="student_name" onChange={handleChange} required />
          <Input label="NPM" type="text" name="student_npm" onChange={handleChange} required />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Program Studi" type="text" name="student_prodi" onChange={handleChange} required />
            <Input label="Kelas" type="text" name="student_class" onChange={handleChange} required />
          </div>

          <Input label="Mata Kuliah" type="text" name="subject" onChange={handleChange} required />
          <Input label="Dosen Pengampu" type="text" name="lecturer" onChange={handleChange} required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Tanggal Pengembalian</label>
              <Input
                type="date"
                name="return_date"
                value={formData.return_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 10)}
                className="[&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Jam Pengembalian</label>
              <Input
                type="time"
                name="return_time"
                value={formData.return_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button type="submit" variant="warning" size="lg" fullWidth className="mt-2">
            Submit Peminjaman
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function BorrowForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-semibold">Memuat Form...</p>
        </div>
      </div>
    }>
      <BorrowFormContent />
    </Suspense>
  );
}
