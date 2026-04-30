"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Home() {
  const [email, setEmail] = useState('boashadmin@kampus.ac.id');
  const [password, setPassword] = useState('12345678');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      alert('Login Sukses! Token tersimpan.');
      router.push('/admin/dashboard');
    } catch (error: any) {
      alert('Login Gagal: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-sm mx-auto mt-20 bg-slate-200 rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-center text-slate-800">Test Login Lentera</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input 
          type="email" 
          value={email} onChange={(e) => setEmail(e.target.value)} 
          className="p-2 border border-slate-400 rounded text-black bg-white" placeholder="Email"
        />
        <input 
          type="password" 
          value={password} onChange={(e) => setPassword(e.target.value)} 
          className="p-2 border border-slate-400 rounded text-black bg-white" placeholder="Password"
        />
        <button type="submit" disabled={loading} className="bg-blue-600 font-bold text-white p-2 rounded hover:bg-blue-700 transition">
          {loading ? 'Loading...' : 'Login ke Dashboard'}
        </button>
      </form>
    </div>
  );
}