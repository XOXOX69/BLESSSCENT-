'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, LogOut, User, Settings, Package, AlertTriangle, CreditCard, Users, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi, inventoryApi, ledgerApi } from '@/lib/api';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'low_stock' | 'overdue' | 'new_member' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export function Header() {
  const { user, logout } = useAuth();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Fetch dashboard data for notifications
  const { data: dashboardData } = useQuery({
    queryKey: ['notifications-dashboard'],
    queryFn: async () => {
      const res = await notificationsApi.getAll();
      return res.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch low stock items
  const { data: lowStockData } = useQuery({
    queryKey: ['notifications-lowstock'],
    queryFn: async () => {
      const res = await inventoryApi.getLowStock();
      return res.data;
    },
    refetchInterval: 60000,
  });

  // Fetch overdue payments
  const { data: overdueData } = useQuery({
    queryKey: ['notifications-overdue'],
    queryFn: async () => {
      const res = await ledgerApi.getOverdue();
      return res.data;
    },
    refetchInterval: 60000,
  });

  // Build notifications list
  const notifications: Notification[] = [];

  // Add low stock notifications
  const lowStockItems = lowStockData?.data || lowStockData?.items || lowStockData || [];
  if (Array.isArray(lowStockItems) && lowStockItems.length > 0) {
    lowStockItems.slice(0, 5).forEach((item: any, index: number) => {
      notifications.push({
        id: `low-stock-${item.id || index}`,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${item.product?.name || item.productName || 'Product'} is running low (${item.quantity || item.currentStock || 0} left)`,
        time: 'Now',
        read: readNotifications.has(`low-stock-${item.id || index}`),
        link: '/dashboard/inventory',
      });
    });
  }

  // Add overdue payment notifications
  const overdueItems = overdueData?.data || overdueData?.items || overdueData || [];
  if (Array.isArray(overdueItems) && overdueItems.length > 0) {
    overdueItems.slice(0, 3).forEach((item: any, index: number) => {
      notifications.push({
        id: `overdue-${item.id || index}`,
        type: 'overdue',
        title: 'Overdue Payment',
        message: `${item.reseller?.name || item.resellerName || 'Reseller'} has overdue balance of ₱${(item.amount || item.balance || 0).toLocaleString()}`,
        time: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Overdue',
        read: readNotifications.has(`overdue-${item.id || index}`),
        link: '/dashboard/ledger',
      });
    });
  }

  // Add summary notifications if no specific items
  if (notifications.length === 0) {
    const lowStockCount = dashboardData?.lowStockAlerts || 0;
    const overdueCount = dashboardData?.overduePayments || 0;
    const newMembers = dashboardData?.today?.newMembers || 0;

    if (lowStockCount > 0) {
      notifications.push({
        id: 'summary-lowstock',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${lowStockCount} item${lowStockCount > 1 ? 's' : ''} need restocking`,
        time: 'Today',
        read: readNotifications.has('summary-lowstock'),
        link: '/dashboard/inventory',
      });
    }

    if (overdueCount > 0) {
      notifications.push({
        id: 'summary-overdue',
        type: 'overdue',
        title: 'Overdue Payments',
        message: `${overdueCount} reseller${overdueCount > 1 ? 's' : ''} with overdue balance`,
        time: 'Today',
        read: readNotifications.has('summary-overdue'),
        link: '/dashboard/ledger',
      });
    }

    if (newMembers > 0) {
      notifications.push({
        id: 'summary-newmembers',
        type: 'new_member',
        title: 'New Members',
        message: `${newMembers} new member${newMembers > 1 ? 's' : ''} registered today`,
        time: 'Today',
        read: readNotifications.has('summary-newmembers'),
        link: '/dashboard/members',
      });
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'low_stock':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'overdue':
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'new_member':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#e4e6e8] flex items-center justify-between px-4 sm:px-6 shadow-sneat">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg sm:text-xl font-semibold text-[#5d596c] truncate">
          Welcome back, {user?.firstName || 'User'}
        </h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-[#7367f0]/10 text-[#6f6b7d]">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#7367f0] text-white border-2 border-white shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 sm:w-96 p-0 bg-white border-[#e4e6e8] shadow-sneat-lg" align="end">
            <div className="flex items-center justify-between p-4 border-b border-[#e4e6e8]">
              <h3 className="font-semibold text-[#5d596c]">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-[#7367f0] hover:text-[#5f55e4] hover:bg-[#7367f0]/10"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <Bell className="h-8 w-8 mb-2 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                  <p className="text-xs text-gray-400">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.link || '#'}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex items-start gap-3 p-4 hover:bg-[#f8f7fa] transition-colors ${
                        !notification.read ? 'bg-[#7367f0]/5' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          notification.type === 'low_stock' ? 'bg-[#ff9f43]/10' :
                          notification.type === 'overdue' ? 'bg-[#ea5455]/10' :
                          notification.type === 'new_member' ? 'bg-[#00cfe8]/10' :
                          'bg-[#7367f0]/10'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#5d596c] truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-[#7367f0] rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-[#6f6b7d] line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#a5a3ae] mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t border-[#e4e6e8] bg-[#f8f7fa]">
              <Link href="/dashboard/reports" className="block">
                <Button variant="outline" size="sm" className="w-full text-sm border-[#7367f0] text-[#7367f0] hover:bg-[#7367f0] hover:text-white">
                  View All Reports
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-[#7367f0]/10">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-[#7367f0] to-[#9e95f5] text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <Badge variant="outline" className="w-fit mt-1 text-xs">
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
