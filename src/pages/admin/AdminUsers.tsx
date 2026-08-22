import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Shield, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to make this user an ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Manage Users</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="p-4">User</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Location</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Role</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cream flex items-center justify-center text-saddle">
                      {user.role === 'admin' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.full_name || 'Anonymous'}</div>
                      <div className="text-xs font-mono text-gray-400 truncate max-w-[100px]">{user.id}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{user.phone || 'N/A'}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {user.city ? `${user.city}, ${user.state}` : 'N/A'}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleRole(user.id, user.role)}
                      className="text-gray-500 hover:text-maroon transition-colors flex items-center gap-1 text-xs font-medium"
                      title={user.role === 'admin' ? 'Remove admin rights' : 'Make admin'}
                    >
                      <UserCog className="h-4 w-4" /> Toggle Role
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
