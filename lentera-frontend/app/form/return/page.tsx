"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ReturnForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionToken = searchParams.get('submission_token');

  // State untuk Dropdown Barang
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  // State untuk Form Input
  const [formData, setFormData] = useState({
    asset_code: '', // Sesuai dengan field di JSON Postman Backend
    student_npm: ''
  });

  // Fetch data alat yang statusnya "borrowed" (sedang dipinjam)
  useEffect(() => {
    if (!submissionToken) {
      setError('Akses ditolak. Token sesi tidak ditemukan.');
      setLoadingOptions(false);
      return;
    }

    const fetchOptions = async () => {
      try {
        // PERHATIKAN: status=borrowed
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

  // Handle Submit Form Pengembalian
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        submission_token: submissionToken,
        asset_code: formData.asset_code,
        student_npm: formData.student_npm
      };
      
      // Nembak API PostReturnForm
      await api.post('/return', payload);
      alert('Pengembalian Berhasil! Terima kasih telah merawat aset kampus.');
      router.push('/'); // Lempar kembali ke halaman awal
    } catch (err: any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;
  if (loadingOptions) return <div className="p-10 text-center text-black">Memuat daftar alat yang dipinjam... ⏳</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-slate-100 rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-center text-teal-600">Form Pengembalian Alat</h1>
      
      {options.length === 0 ? (
        <div className="text-center p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800">
          Tidak ada alat yang sedang dipinjam saat ini.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Dropdown Alat dari API */}
          <div>
            <label className="block text-sm font-bold mb-1">Pilih Alat yang Ingin Dikembalikan</label>
            <select 
              name="asset_code" 
              value={formData.asset_code} 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-slate-300 rounded bg-white text-black"
            >
              <option value="">-- Pilih Alat --</option>
              {options.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.label} ({opt.category})
                </option>
              ))}
            </select>
          </div>

          {/* Validasi NPM (Sesuai logic backend untuk mencegah orang lain ngembaliin barang) */}
          <div>
            <label className="block text-sm font-bold mb-1">Masukkan NPM Peminjam</label>
            <input 
              type="text" 
              name="student_npm" 
              value={formData.student_npm}
              onChange={handleChange} 
              required 
              placeholder="Contoh: 12345678"
              className="w-full p-2 border border-slate-300 rounded bg-white text-black" 
            />
            <p className="text-xs text-slate-500 mt-1">
              * NPM harus sesuai dengan NPM saat melakukan peminjaman alat.
            </p>
          </div>

          <button type="submit" className="mt-4 bg-teal-600 text-white font-bold py-3 rounded hover:bg-teal-700 transition">
            Submit Pengembalian
          </button>
        </form>
      )}
    </div>
  );
}