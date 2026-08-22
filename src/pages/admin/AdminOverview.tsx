import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { IndianRupee, ShoppingCart, Package, Users } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Mon', revenue: 4200, orders: 24, products: 45, users: 2 },
  { name: 'Tue', revenue: 4800, orders: 28, products: 46, users: 3 },
  { name: 'Wed', revenue: 3800, orders: 22, products: 46, users: 1 },
  { name: 'Thu', revenue: 5200, orders: 39, products: 48, users: 5 },
  { name: 'Fri', revenue: 6100, orders: 48, products: 48, users: 6 },
  { name: 'Sat', revenue: 7500, orders: 58, products: 50, users: 8 },
  { name: 'Sun', revenue: 8400, orders: 65, products: 51, users: 12 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-900">
          {payload[0].name === 'revenue' ? '₹' : ''}
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const AdminOverview: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('Total Revenue');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch Orders for revenue and count
        const { data: orders } = await supabase.from('orders').select('total_amount');
        const revenue = orders?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;
        const orderCount = orders?.length || 0;

        // Fetch Products count
        const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

        // Fetch Users count
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        setStats({
          totalRevenue: revenue,
          totalOrders: orderCount,
          totalProducts: productCount || 0,
          totalUsers: userCount || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100', path: '/admin/orders' },
    { name: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100', path: '/admin/orders' },
    { name: 'Total Products', value: stats.totalProducts.toString(), icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', path: '/admin/products' },
    { name: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', path: '/admin/users' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-32 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div 
              key={stat.name} 
              onClick={() => setSelectedMetric(stat.name)}
              className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer ${selectedMetric === stat.name ? 'border-maroon ring-1 ring-maroon' : 'border-gray-100'}`}
            >
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedMetric} Trend</h2>
              <p className="text-sm text-gray-500 mt-1">Performance over the last 7 days</p>
            </div>
            <div className="px-4 py-2 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-100 font-medium">
              Last 7 Days
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === 'Total Revenue' ? (
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#16a34a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              ) : selectedMetric === 'Total Orders' ? (
                <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="orders" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : selectedMetric === 'Total Products' ? (
                <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9333ea', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="products" stroke="#9333ea" strokeWidth={4} dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ea580c', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="users" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
