"use client";
import './globals.css';
import { useEffect, useState } from 'react';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mode = stored ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', mode === 'dark');
    setReady(true);
  }, []);
  if (!ready) return null;
  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <ThemeWrapper>
          <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:bg-gray-900/70">
            <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">ENS Hub</div>
              <button
                onClick={() => {
                  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                  document.documentElement.classList.toggle('dark', next === 'dark');
                  localStorage.setItem('theme', next as 'light');
                }}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                Toggle theme
              </button>
            </div>
          </header>
          <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 p-4">
            <aside className="col-span-12 md:col-span-3 lg:col-span-2">
              <nav className="rounded-lg border bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-800">
                <a href="/" className="block rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">Overview</a>
                <a href="/names" className="block rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">Names</a>
                <a href="/analytics" className="block rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">Analytics</a>
                <a href="/l2" className="block rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">L2 Adoption</a>
                <a href="http://localhost:4000/docs" target="_blank" className="block rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">Docs</a>
                <a href="http://localhost:4000/export/registrations.csv" target="_blank" className="block rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">Exports</a>
              </nav>
            </aside>
            <section className="col-span-12 md:col-span-9 lg:col-span-10">
              {children}
            </section>
          </div>
        </ThemeWrapper>
      </body>
    </html>
  );
}

