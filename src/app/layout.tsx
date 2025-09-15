import type { Metadata } from 'next';
import './globals.css';
import AmplifyProvider from './AmplifyProvider';

export const metadata: Metadata = { title: 'GPA Tracker', description: 'Track grades & GPA' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">GPA Tracker</h1>
            <nav className="text-sm text-gray-400">v0.1</nav>
          </header>
          <AmplifyProvider>{children}</AmplifyProvider>
        </div>
      </body>
    </html>
  );
}
