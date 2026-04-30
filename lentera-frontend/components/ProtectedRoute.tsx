"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/'); // replace biar gak bisa di-back
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Sembunyikan konten sampai token terverifikasi
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black font-bold">
        Mengecek Otorisasi... 🛡️
      </div>
    );
  }

  return <>{children}</>;
}