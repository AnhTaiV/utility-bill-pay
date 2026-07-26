'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Electricity', href: '/dashboard?type=electricity', icon: '⚡' },
  { label: 'Water', href: '/dashboard?type=water', icon: '💧' },
  { label: 'Internet', href: '/dashboard?type=internet', icon: '🌐' },
  { label: 'Gas', href: '/dashboard?type=gas', icon: '🔥' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-nav w-64 max-md:w-full max-md:min-h-0 flex shrink-0 flex-col text-white shadow-xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-yellow-400/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h1 className="font-heading font-bold text-xl leading-none">BayadinBills</h1>
            <p className="text-yellow-100 text-xs mt-0.5">Pay bills with USDC</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-yellow-400/30">
        <p className="text-yellow-100 text-xs uppercase tracking-wide font-heading mb-1">
          Logged in as
        </p>
        <p className="font-heading font-semibold text-sm">Nida Reyes</p>
        <p className="text-yellow-100 text-xs">Davao City, PH</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 max-md:py-3">
        <p className="text-yellow-200/70 text-xs uppercase tracking-wide font-heading px-2 mb-2">
          Biller Categories
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-heading transition-all ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-yellow-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* USDC rate footer */}
      <div className="px-6 py-4 border-t border-yellow-400/30">
        <p className="text-yellow-200/70 text-xs font-heading">SEP-38 Rate</p>
        <p className="text-white font-heading font-bold text-sm">1 USDC = ₱162.50</p>
        <p className="text-yellow-200/50 text-xs">Stellar Testnet</p>
      </div>
    </aside>
  );
}
