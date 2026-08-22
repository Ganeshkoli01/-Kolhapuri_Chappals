import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Package, Shield, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderDetailsModal } from './admin/OrderDetailsModal';

interface ProfileProps {
  userId: string;
}

export const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'security'>('info');
  const [loading, setLoading] = useState(false);

  // Profile Info State
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: ''
  });

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Security State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', userId);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;
      toast.success('Password updated successfully!');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      
      // Restock items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);
        
      if (orderItems) {
        for (const item of orderItems) {
          if (item.product_id) {
            await supabase.rpc('increment_stock', { p_id: item.product_id, p_qty: item.quantity });
          }
        }
      }

      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'info' ? 'bg-maroon text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-cream hover:text-maroon'
            }`}
          >
            <User className="h-5 w-5" /> Profile Info
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-maroon text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-cream hover:text-maroon'
            }`}
          >
            <Package className="h-5 w-5" /> My Orders
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'security' ? 'bg-maroon text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-cream hover:text-maroon'
            }`}
          >
            <Shield className="h-5 w-5" /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          
          {/* PROFILE INFO TAB */}
          {activeTab === 'info' && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Personal Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.full_name}
                      onChange={e => setProfile({...profile, full_name: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={profile.phone}
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input 
                      type="text" 
                      value={profile.address}
                      onChange={e => setProfile({...profile, address: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input 
                      type="text" 
                      value={profile.city}
                      onChange={e => setProfile({...profile, city: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input 
                        type="text" 
                        value={profile.state}
                        onChange={e => setProfile({...profile, state: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input 
                        type="text" 
                        value={profile.postal_code}
                        onChange={e => setProfile({...profile, postal_code: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-maroon hover:bg-maroon-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-5 hover:border-maroon/30 transition-colors bg-gray-50/50">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-mono mb-1">Order #{order.id.split('-')[0].toUpperCase()}</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-bold text-maroon-dark">₹{order.total_amount}</span>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                              order.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 
                              order.payment_status === 'cancelled' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.payment_status}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              order.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.delivery_status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {order.delivery_status || 'Processing'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                          {order.payment_status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={loading}
                              className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-transparent rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:text-maroon hover:border-maroon transition-colors"
                          >
                            <Eye className="h-4 w-4" /> View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={passwords.newPassword}
                    onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                    required
                    className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                    required
                    className="w-full border rounded-lg px-4 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                  />
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-maroon hover:bg-maroon-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full"
                  >
                    <Shield className="h-5 w-5" /> {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isCustomerView={true}
        />
      )}
    </div>
  );
};
