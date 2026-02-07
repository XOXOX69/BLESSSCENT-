'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, resellersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Trophy,
  Medal,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

function StatCard({ title, value, description, icon, trend, color = 'yellow' }: StatCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-400/10 text-yellow-600',
    green: 'bg-green-400/10 text-green-600',
    blue: 'bg-blue-400/10 text-blue-600',
    purple: 'bg-purple-400/10 text-purple-600',
    orange: 'bg-orange-400/10 text-orange-600',
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center mt-2 flex-wrap gap-2">
            {trend !== undefined && (
              <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(trend)}%
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        )}
      </CardContent>
      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full blur-2xl ${color === 'yellow' ? 'bg-yellow-400' : color === 'green' ? 'bg-green-400' : color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'}`} />
    </Card>
  );
}

function AlertCard({ title, value, description, icon, variant }: { 
  title: string; 
  value: number; 
  description: string; 
  icon: React.ReactNode;
  variant: 'warning' | 'danger' | 'info';
}) {
  const variants = {
    warning: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    danger: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
    info: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
  };
  
  const textVariants = {
    warning: 'text-amber-700',
    danger: 'text-red-700',
    info: 'text-blue-700',
  };

  return (
    <Card className={`${variants[variant]} border shadow-sm`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${textVariants[variant]}`}>{title}</p>
            <p className={`text-3xl font-bold mt-1 ${textVariants[variant]}`}>{value}</p>
            <p className={`text-xs mt-1 ${textVariants[variant]} opacity-80`}>{description}</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${textVariants[variant]} bg-white/50`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getSummary();
      return response.data;
    },
  });

  const { data: topResellers, isLoading: loadingResellers } = useQuery({
    queryKey: ['topResellers'],
    queryFn: async () => {
      const response = await resellersApi.getTopResellers(3);
      return response.data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mock hourly data for chart
  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${(i + 8).toString().padStart(2, '0')}:00`,
    sales: Math.floor(Math.random() * 10000) + 1000,
  }));

  const weeklyData = [
    { day: 'Mon', sales: 12000, orders: 45 },
    { day: 'Tue', sales: 15000, orders: 52 },
    { day: 'Wed', sales: 18000, orders: 61 },
    { day: 'Thu', sales: 14000, orders: 48 },
    { day: 'Fri', sales: 22000, orders: 75 },
    { day: 'Sat', sales: 28000, orders: 92 },
    { day: 'Sun', sales: 20000, orders: 68 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s your business overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(dashboard?.today?.sales || 0)}
          description={`${dashboard?.today?.transactions || 0} transactions`}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(dashboard?.thisMonth?.sales || 0)}
          trend={dashboard?.thisMonth?.growth || 12}
          icon={<TrendingUp className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="New Members"
          value={dashboard?.today?.newMembers || 0}
          description="Registered today"
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Low Stock"
          value={dashboard?.lowStockAlerts || 0}
          description="Need restocking"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Charts - Stack on mobile, side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Clock className="h-5 w-5 text-yellow-500" />
                Today&apos;s Sales
              </CardTitle>
              <Badge variant="secondary" className="text-xs">Hourly</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'Sales']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#eab308"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShoppingCart className="h-5 w-5 text-yellow-500" />
                Weekly Performance
              </CardTitle>
              <Badge variant="secondary" className="text-xs">This Week</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'sales' ? formatCurrency(value as number) : value,
                    name === 'sales' ? 'Sales' : 'Orders'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="sales" fill="#eab308" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards - Stack on mobile, 3 cols on desktop */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AlertCard
          title="Low Stock Items"
          value={dashboard?.lowStockAlerts || 0}
          description="Items below reorder level"
          icon={<Package className="h-6 w-6" />}
          variant="warning"
        />
        <AlertCard
          title="Overdue Payments"
          value={dashboard?.overduePayments || 0}
          description="Reseller accounts overdue"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="danger"
        />
        <AlertCard
          title="New Members"
          value={dashboard?.thisMonth?.newMembers || 0}
          description="This month's registrations"
          icon={<Users className="h-6 w-6" />}
          variant="info"
        />
      </div>

      {/* Top 3 Resellers Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Resellers
            </CardTitle>
            <Badge variant="secondary" className="text-xs">By Total Purchases</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingResellers ? (
            <div className="flex justify-center gap-8 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-gray-200 mb-3" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : topResellers && topResellers.length > 0 ? (
            <div className="flex flex-col sm:flex-row justify-center items-center sm:items-end gap-8 py-4">
              {/* Second Place */}
              {topResellers[1] && (
                <div className="flex flex-col items-center order-1 sm:order-1">
                  <div className="relative mb-3">
                    <Avatar className="w-16 h-16 border-4 border-gray-300 shadow-lg">
                      <AvatarImage src={topResellers[1].imageUrl} alt={topResellers[1].company} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-bold">
                        {topResellers[1].company?.[0] || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-gray-400 rounded-full p-1">
                      <Medal className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 text-sm truncate max-w-[120px]">{topResellers[1].company}</p>
                    <p className="text-xs text-gray-500">{topResellers[1].contactPerson}</p>
                    <p className="text-sm font-bold text-gray-600 mt-1">
                      {formatCurrency(topResellers[1].totalPurchases || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* First Place */}
              {topResellers[0] && (
                <div className="flex flex-col items-center order-0 sm:order-2">
                  <div className="relative mb-3">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    </div>
                    <Avatar className="w-24 h-24 border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-100">
                      <AvatarImage src={topResellers[0].imageUrl} alt={topResellers[0].company} />
                      <AvatarFallback className="bg-yellow-50 text-yellow-700 text-2xl font-bold">
                        {topResellers[0].company?.[0] || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className="mb-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">#1 Top Seller</Badge>
                    <p className="font-bold text-gray-900 truncate max-w-[140px]">{topResellers[0].company}</p>
                    <p className="text-sm text-gray-500">{topResellers[0].contactPerson}</p>
                    <p className="text-lg font-bold text-yellow-600 mt-1">
                      {formatCurrency(topResellers[0].totalPurchases || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Third Place */}
              {topResellers[2] && (
                <div className="flex flex-col items-center order-2 sm:order-3">
                  <div className="relative mb-3">
                    <Avatar className="w-14 h-14 border-4 border-orange-300 shadow-lg">
                      <AvatarImage src={topResellers[2].imageUrl} alt={topResellers[2].company} />
                      <AvatarFallback className="bg-orange-50 text-orange-600 text-lg font-bold">
                        {topResellers[2].company?.[0] || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-orange-400 rounded-full p-1">
                      <Medal className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 text-sm truncate max-w-[100px]">{topResellers[2].company}</p>
                    <p className="text-xs text-gray-500">{topResellers[2].contactPerson}</p>
                    <p className="text-sm font-bold text-orange-600 mt-1">
                      {formatCurrency(topResellers[2].totalPurchases || 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No reseller data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
