'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center text-slate-900 p-6">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-xl space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mx-auto">
          404
        </div>
        <h2 className="text-xl font-black text-slate-900">Page Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested page or portal route does not exist.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
