'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load user');
        setUser(data.user);
      })
      .catch((err) => {
        setError(err.message);
        localStorage.removeItem('token');
        setTimeout(() => router.push('/login'), 1500);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {user && (
          <div className="space-y-2">
            <p className="text-gray-600">Logged in as</p>
            <p className="font-semibold text-gray-800">{user.email}</p>
          </div>
        )}
        {!user && !error && <p className="text-gray-400">Loading...</p>}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
