"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

// 1. PISAHKAN LOGIKA UTAMA KE KOMPONEN INI
function ScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrToken = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionToken, setSubmissionToken] = useState('');

  useEffect(() => {
    if (!qrToken) {
      setError('Token QR tidak ditemukan. Silakan scan ulang dari monitor.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await api.get(`/gateway/validate?token=${qrToken}`);
        setSubmissionToken(res.data.data.submission_token);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Token QR tidak valid atau kadaluarsa.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [qrToken]);

  // Tambahin bg-white text-black biar gak kena bug dark mode Tailwind
  if (loading) return <div className="p-10 text-center font-bold bg-white text-black min-h-screen">Memvalidasi QR Code... ⏳</div>;

  if (error) return (
    <div className="p-10 text-center text-red-600 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">❌ Akses Ditolak</h1>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-10 text-black">
      <div className="max-w-md mx-auto mt-10 bg-emerald-50 border border-emerald-200 rounded-xl shadow-md text-center p-8">
        <h1 className="text-2xl font-bold text-emerald-800 mb-2">✅ Akses Diterima!</h1>
        <p className="text-sm text-emerald-600 mb-8">Silakan pilih keperluan Anda di bawah ini:</p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => router.push(`/form/borrow?submission_token=${submissionToken}`)}
            className="bg-amber-500 text-white p-3 rounded font-bold hover:bg-amber-600 transition"
          >
            Pinjam Alat 📦
          </button>

          <button 
            onClick={() => router.push(`/form/return?submission_token=${submissionToken}`)}
            className="bg-teal-500 text-white p-3 rounded font-bold hover:bg-teal-600 transition"
          >
            Kembalikan Alat 🔄
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. BUNGKUS DENGAN SUSPENSE DI EXPORT DEFAULT-NYA
export default function ScanGateway() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold bg-white text-black min-h-screen">Memuat Gateway... ⏳</div>}>
      <ScanContent />
    </Suspense>
  );
}