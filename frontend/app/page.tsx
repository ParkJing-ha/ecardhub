import Link from "next/link"; // 1. Import the Link component

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900">
      <header className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-blue-600">
          Ecardhub 🚀
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Create, customize, and share digital cards instantly.
        </p>
      </header>

      <main className="mt-10">
        {/* 2. Use Link to route to /dashboard */}
        <Link href="/dashboard">
          <button className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition">
            Get Started
          </button>
        </Link>
      </main>
    </div>
  );
}
