"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { QRCodeCanvas } from 'qrcode.react';

export default function DisplayQR() {
  const router = useRouter();
  const [qrToken, setQrToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  
  // GANTI INI DENGAN IP LAPTOP LO PAS DEMO NANTI! (Contoh: '192.168.1.15:3000')
  // Kalau masih dev biasa, biarin 'localhost:3000'
  const HOST_URL = 'localhost:3000';

  const fetchQRCode = async () => {
    try {
      // Ingat: Endpoint ini diproteksi auth:sanctum, jadi butuh token login admin!
      const res = await api.get('/gateway/generate');
      
      // Ambil data dari response backend
      setQrToken(res.data.data.qr_token);
      setExpiresAt(res.data.data.expires_at);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesi Admin berakhir. Silakan login kembali lewat dashboard.');
      } else {
        setError('Gagal terhubung ke server.');
      }
    }
  };

  useEffect(() => {
    // 1. Fetch pertama kali pas halaman dibuka
    fetchQRCode();

    // 2. Set interval untuk auto-refresh (Misal kita set polling tiap 1 menit buat jaga-jaga)
    // Di aplikasi real, lo bisa pakai interval_minutes dari backend buat ngatur setInterval ini.
    const interval = setInterval(() => {
      fetchQRCode();
    }, 60000); // 60.000 ms = 1 menit

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-10 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">⚠️ Sistem Terputus</h1>
        <p className="text-xl">{error}</p>
        <button onClick={() => router.push('/')} className="mt-8 bg-blue-600 px-6 py-2 rounded font-bold">
          Kembali ke Login
        </button>
      </div>
    );
  }

  // URL yang akan ditanam ke dalam gambar QR Code
  // Langsung nembak ke halaman /scan yang udah kita buat tadi!
  const scanUrl = `http://${HOST_URL}/scan?token=${qrToken}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-widest text-cyan-400 mb-2">LENTERA</h1>
        <p className="text-2xl text-slate-400 tracking-wider">Sistem Peminjaman Aset Laboratorium</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-cyan-900/50 flex flex-col items-center">
        {qrToken ? (
          <>
            <QRCodeCanvas 
              value={scanUrl} 
              size={350} 
              level={"H"}
              includeMargin={true}
            />
            <p className="text-slate-800 font-bold text-xl mt-6">Scan untuk Meminjam / Mengembalikan</p>
            <p className="text-slate-500 font-mono mt-2 text-sm">Berlaku s/d: {expiresAt}</p>
          </>
        ) : (
          <div className="w-[350px] h-[350px] flex items-center justify-center text-slate-800 font-bold">
            Memuat QR Code... ⏳
          </div>
        )}
      </div>

      {/* URL ini sengaja ditampilin kecil buat lo nge-test nge-klik pas masa development (tanpa HP) */}
      <div className="mt-10 text-slate-500 text-sm flex flex-col items-center">
        <p>Dev Mode: Kalau malas scan, klik link di bawah:</p>
        <a href={scanUrl} target="_blank" className="text-cyan-600 hover:underline break-all mt-1">
          {scanUrl}
        </a>
      </div>
    </div>
  );
}