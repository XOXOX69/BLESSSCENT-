'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  Users,
  UserCheck,
  CreditCard,
  FileText,
  Settings,
  ChevronLeft,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
  { href: '/dashboard/pricing', label: 'Pricing', icon: Tags },
  { href: '/dashboard/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/dashboard/members', label: 'Members', icon: Users },
  { href: '/dashboard/resellers', label: 'Resellers', icon: UserCheck },
  { href: '/dashboard/ledger', label: 'Ledger', icon: CreditCard },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/users', label: 'Users', icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="h-full bg-gradient-to-b from-black via-gray-900 to-black text-white w-full">
      <div className="flex h-16 items-center justify-between px-4 border-b border-yellow-500/20 bg-yellow-500/5">
        <Link href="/dashboard" onClick={handleNavClick} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-linear-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-lg text-yellow-400">BLESSCENT</span>
        </Link>
        {/* Close button for mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-400/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-medium shadow-lg shadow-yellow-500/25'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5 hover:backdrop-blur-sm'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="ml-3">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
