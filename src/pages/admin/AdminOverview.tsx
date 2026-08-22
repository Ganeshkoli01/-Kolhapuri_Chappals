import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { IndianRupee, ShoppingCart, Package, Users } from 'lucide-react';

export const AdminOverview: React.FC = () => {
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
    { name: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Products', value: stats.totalProducts.toString(), icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
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
            <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
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
    </div>
  );
};
