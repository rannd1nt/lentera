"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DisplayQR() {
  const router = useRouter();
  const [qrToken, setQrToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const fetchQRCode = async () => {
    try {
      const res = await api.get('/gateway/generate');
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
    fetchQRCode();
    const interval = setInterval(fetchQRCode, 60000);
    return () => clearInterval(interval);
  }, []);

  const scanUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan?token=${qrToken}` : '';

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
        <Card className="max-w-md w-full p-10 text-center z-10 animate-lentera-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/15 text-red-400 mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-400 mb-3">Sistem Terputus</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>Kembali ke Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--accent-secondary)]/10 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 rounded-full blur-3xl animate-lentera-float" />

      <div className="text-center mb-10 relative z-10 animate-lentera-fade-in">
        <h1 className="text-6xl font-extrabold tracking-widest bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent animate-lentera-gradient-shift mb-3">
          LENTERA
        </h1>
        <p className="text-xl text-slate-400 tracking-wider">Sistem Peminjaman Aset Laboratorium</p>
      </div>

      <Card glow className="p-10 relative z-10 animate-lentera-slide-up flex flex-col items-center">
        <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-[var(--accent-glow)]/20">
          {qrToken ? (
            <QRCodeCanvas
              value={scanUrl}
              size={350}
              level={"H"}
              includeMargin={true}
            />
          ) : (
            <div className="w-[350px] h-[350px] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-slate-600 font-semibold">Memuat QR Code...</p>
              </div>
            </div>
          )}
        </div>

        {qrToken && (
          <div className="text-center mt-8">
            <h2 className="text-[var(--foreground)] font-bold text-2xl">Scan untuk Meminjam / Mengembalikan</h2>
            <p className="text-[var(--subtle)] font-mono mt-2 text-sm tracking-wide">Berlaku s/d: {expiresAt}</p>
          </div>
        )}
      </Card>

      <div className="mt-10 text-slate-500 text-sm flex flex-col items-center relative z-10">
        <p>Dev Mode: Klik link di bawah untuk test tanpa scan:</p>
        <a href={scanUrl} target="_blank" className="text-[var(--accent-secondary)] hover:underline break-all mt-1 transition-colors">
          {scanUrl}
        </a>
      </div>
    </div>
  );
}
