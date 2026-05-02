"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--accent-secondary)]/10 via-transparent to-transparent" />
      <div className="text-center z-10 animate-lentera-fade-in">
        <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold">Memvalidasi QR Code...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
      <Card className="max-w-md w-full p-8 text-center z-10 animate-lentera-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 text-red-400 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Akses Ditolak</h1>
        <p className="text-slate-400 text-sm">{error}</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--accent-primary)]/10 via-transparent to-transparent" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-3xl animate-lentera-float" />

      <Card className="max-w-md w-full p-8 text-center z-10 animate-lentera-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 bg-clip-text text-transparent mb-2">Akses Diterima</h1>
        <p className="text-sm text-slate-400 mb-8">Silakan pilih keperluan Anda di bawah ini:</p>

        <div className="flex flex-col gap-3">
          <Button
            variant="warning"
            size="lg"
            fullWidth
            onClick={() => router.push(`/form/borrow?submission_token=${submissionToken}`)}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Pinjam Alat
            </span>
          </Button>

          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={() => router.push(`/form/return?submission_token=${submissionToken}`)}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Kembalikan Alat
            </span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function ScanGateway() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-semibold">Memuat Sistem...</p>
        </div>
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
