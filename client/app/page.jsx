import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Auth Demo</h1>
        <p className="text-gray-500">Next.js + Express + Neon + JWT</p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Register
          </Link>
          <Link href="/login" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
