import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderDetailsModal } from './OrderDetailsModal';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Failed to fetch orders');
    } else if (data) {
      // Fetch profiles manually since there's no direct FK between orders and profiles
      const userIds = [...new Set(data.map(order => order.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      const ordersWithProfiles = data.map(order => ({
        ...order,
        profiles: profileMap[order.user_id] || null
      }));

      setOrders(ordersWithProfiles);
    }
    setLoading(false);
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Order status updated');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
    }
  };
  const updateDeliveryStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Delivery status updated');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update delivery status');
    }
  };
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Manage Orders</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Total</th>
              <th className="p-4">Method</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Delivery</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">Loading orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">No orders found.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-xs font-mono text-gray-500 truncate max-w-[100px]">{order.id}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{order.profiles?.full_name || 'Guest'}</div>
                    <div className="text-xs text-gray-500">{order.shipping_address?.city}, {order.shipping_address?.state}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-900 font-bold">₹{order.total_amount}</td>
                  <td className="p-4 text-sm text-gray-600">{order.payment_method}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 capitalize text-sm font-medium">
                      {getStatusIcon(order.payment_status)}
                      {order.payment_status}
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                      className={`text-xs border rounded px-2 py-1.5 outline-none cursor-pointer font-medium ${
                        order.delivery_status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                        order.delivery_status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                      value={order.delivery_status || 'processing'}
                      onChange={(e) => updateDeliveryStatus(order.id, e.target.value)}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="text-gray-500 hover:text-maroon transition-colors flex items-center gap-1 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:border-maroon hover:bg-maroon/5"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                    <select 
                      className="text-xs border rounded px-2 py-2 outline-none cursor-pointer"
                      value={order.payment_status}
                      onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};
