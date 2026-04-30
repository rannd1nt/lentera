"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function BorrowForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionToken = searchParams.get('submission_token');

  // State untuk Dropdown Barang
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  // State untuk Form Input
  const [formData, setFormData] = useState({
    code: '',
    student_name: '',
    student_npm: '',
    student_prodi: '',
    student_class: '',
    subject: '',
    lecturer: '',
    expected_return_at: ''
  });

  // Fetch data alat yang "available" saat halaman diload
  useEffect(() => {
    if (!submissionToken) {
      setError('Akses ditolak. Token sesi tidak ditemukan.');
      setLoadingOptions(false);
      return;
    }

    const fetchOptions = async () => {
      try {
        const res = await api.get(`/assets/form-options?submission_token=${submissionToken}&status=available`);
        setOptions(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal mengambil data alat.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [submissionToken]);

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Kita gabungin token sama data form
      const payload = {
        submission_token: submissionToken,
        ...formData,
        asset_code: formData.code
      };
      
      // 2. Formatting Tanggal: Ganti 'T' menjadi spasi dan tambah detik ':00'
    // Input browser: "2026-04-30T15:00" -> Hasil: "2026-04-30 15:00:00"
    if (payload.expected_return_at) {
      payload.expected_return_at = payload.expected_return_at.replace('T', ' ') + ':00';
    }

    // 3. Bersihkan field 'code' agar tidak membingungkan backend
    delete payload.code;

    // 4. Kirim ke API
    const res = await api.post('/borrow', payload);
    
    alert('Peminjaman Berhasil! Data sudah masuk ke database.');
    router.push('/admin/dashboard'); // Lempar ke dashboard buat cek hasil
    } catch (err: any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;
  if (loadingOptions) return <div className="p-10 text-center">Memuat daftar alat...</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-slate-100 rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-center text-amber-600">Form Peminjaman Alat</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Dropdown Alat dari API */}
        <div>
          <label className="block text-sm font-bold mb-1">Pilih Alat</label>
          <select 
            name="code" 
            value={formData.code} 
            onChange={handleChange} 
            required 
            className="w-full p-2 border rounded bg-white"
          >
            <option value="">-- Pilih Alat yang Tersedia --</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label} ({opt.category})
              </option>
            ))}
          </select>
        </div>

        {/* Input Mahasiswa */}
        <div>
          <label className="block text-sm font-bold mb-1">Nama Lengkap</label>
          <input type="text" name="student_name" onChange={handleChange} required className="w-full p-2 border rounded bg-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-1">NPM</label>
          <input type="text" name="student_npm" onChange={handleChange} required className="w-full p-2 border rounded bg-white" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Program Studi</label>
            <input type="text" name="student_prodi" onChange={handleChange} required className="w-full p-2 border rounded bg-white" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Kelas</label>
            <input type="text" name="student_class" onChange={handleChange} required className="w-full p-2 border rounded bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Mata Kuliah</label>
          <input type="text" name="subject" onChange={handleChange} required className="w-full p-2 border rounded bg-white" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Dosen Pengampu</label>
          <input type="text" name="lecturer" onChange={handleChange} required className="w-full p-2 border rounded bg-white" />
        </div>

        <input 
            type="datetime-local" 
            name="expected_return_at" 
            onChange={handleChange} 
            required 

            min={new Date().toISOString().slice(0, 16)}
            className="w-full p-2 border rounded bg-white text-black" 
        />

        <button type="submit" className="mt-4 bg-amber-600 text-white font-bold py-3 rounded hover:bg-amber-700">
          Submit Peminjaman
        </button>
      </form>
    </div>
  );
}