'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Menu, X } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const links = [
  { href: '/', label: '홈' },
  { href: '/simulator', label: '시뮬레이터' },
  { href: '/about', label: '전략 소개' },
  { href: '/contact', label: '문의' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <TrendingUp className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              <div className="absolute inset-0 blur-md bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Pivot<span className="text-emerald-400">Sim</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  pathname === l.href
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/simulator"
              className="ml-3 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all animate-glow-pulse"
            >
              무료 체험
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'block px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  pathname === l.href
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
